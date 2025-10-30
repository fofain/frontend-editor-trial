/**
 * Editor Manager Module for Elementor Menu Frontend Editor
 * Handles edit mode toggling and editor initialization
 */
var EFE = EFE || {};

EFE.EditorManager = (function($) {
    'use strict';
    
    // Private variables
    let editMode = false;
    let hasUnsavedChanges = false;
    let changesStore = {
        widgets: {},      // Store widget changes by widgetId
        sections: {},     // Store section operations
        attributes: {},   // Store dish/allergen attributes
        removals: [],     // IDs of elements to be removed
        duplications: [], // Info about duplications
        movements: []     // Info about section movements
    };
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
            // Module initialization
    

            // Setup beforeunload handler
            this.setupBeforeUnloadHandler();
        },
        
        /**
         * Get edit mode status
         */
        isEditModeActive: function() {
            return editMode;
        },
        
        /**
         * Get unsaved changes status
         */
        hasUnsavedChanges: function() {
            return hasUnsavedChanges;
        },
        
        /**
         * Set unsaved changes status
         */
        setUnsavedChanges: function(status) {
            hasUnsavedChanges = status;
        },
        
        /**
         * Store a change in the changes store
         */
        addChange: function(type, data) {
            hasUnsavedChanges = true;

            switch(type) {
                case 'widget':
                    changesStore.widgets[data.widgetId] = data;
                    break;
                case 'attribute':
                    // Create a unique key that includes both section ID and attribute type
                    const attributeKey = data.type + '_' + data.sectionId;
                    changesStore.attributes[attributeKey] = data;
                    break;
                case 'removal':
                    changesStore.removals.push(data);
                    break;
                case 'duplication':
                    changesStore.duplications.push(data);
                    break;
                case 'movement':
                    changesStore.movements.push(data);
                    break;
            }


        },
        
        /**
         * Clear all stored changes
         */
        clearChanges: function() {
            changesStore = {
                widgets: {},
                sections: {},
                attributes: {},
                removals: [],
                duplications: [],
                movements: []
            };
            hasUnsavedChanges = false;
        },
        
        /**
         * Get all stored changes
         */
        getChanges: function() {
            return changesStore;
        },
        
        // In editor-manager.js, modify the saveAllChanges method:
        saveAllChanges: function(callback) {
            // Show loading overlay
            EFE.EditorManager.showLoadingOverlay();
            
            // Temporarily remove beforeunload handler to prevent browser warning
            $(window).off('beforeunload');

            // Show saving notification
            EFE.Utils.showNotification('Salvataggio delle modifiche...', 'info');

            // If no changes, just reload
            if (!hasUnsavedChanges) {
                setTimeout(function() {
                    location.reload();
                }, 1000);
                return;
            }

            // Call the batch save AJAX function
            EFE.AjaxHandler.batchSaveChanges(changesStore, function(response) {
                // Hide loading overlay
                EFE.EditorManager.hideLoadingOverlay();
                
                if (response.success) {
                    console.log('EFE: Save response received:', response);
                    console.log('EFE: Response data:', response.data);
                    
                    // Get the actual results from the response
                    const results = response.data && response.data.results ? response.data.results : response.data;
                    console.log('EFE: Results:', results);
                    
                    // --- PATCH: Update duplicated section IDs in DOM before reload ---
                    if (results && results.duplications && Array.isArray(results.duplications)) {
                        results.duplications.forEach(function(dup) {
                            if (dup.operation_id && dup.new_section_id) {
                                console.log('EFE: Processing duplication:', dup);
                                // Find the duplicated section by operation ID
                                var $dupSection = $('.efe-pending-duplication[data-operation-id="' + dup.operation_id + '"]');
                                if ($dupSection.length) {
                                    console.log('EFE: Found duplicated section, updating...');
                                    // Update data-section-id to the real new section ID
                                    $dupSection.attr('data-section-id', dup.new_section_id);
                                    // Remove the pending duplication class
                                    $dupSection.removeClass('efe-pending-duplication');
                                    // Also update controls/forms inside the section if needed
                                    $dupSection.find('[data-section-id]').attr('data-section-id', dup.new_section_id);
                                    // Remove the duplication banner if present
                                    $dupSection.find('.efe-duplicate-banner').remove();
                                    
                                    // Update widget IDs if provided
                                    if (dup.widget_mappings && Array.isArray(dup.widget_mappings)) {
                                        dup.widget_mappings.forEach(function(mapping) {
                                            const $widget = $dupSection.find('[data-widget-id="' + mapping.temp_id + '"]');
                                            if ($widget.length) {
                                                console.log('EFE: Updating widget ID from', mapping.temp_id, 'to', mapping.real_id);
                                                $widget.attr('data-widget-id', mapping.real_id);
                                                $widget.attr('id', mapping.real_id);
                                            }
                                        });
                                    }
                                } else {
                                    console.warn('EFE: Could not find duplicated section with operation ID:', dup.operation_id);
                                }
                            }
                        });
                    }
                    // --- END PATCH ---

                    // Clear changes
                    this.clearChanges();

                    // Check if we have new dishes that need to be made permanent
                    let hasNewDishes = false;
                    let hasDuplications = false;
                    let hasRemovals = false;
                    
                    console.log('EFE: Checking for new dishes in results:', results);
                    
                    // Check for duplications (including new dishes)
                    if (results && results.duplications && Array.isArray(results.duplications)) {
                        console.log('EFE: Found duplications array with', results.duplications.length, 'entries');
                        hasDuplications = true;
                        results.duplications.forEach(function(dup, index) {
                            console.log('EFE: Checking duplication', index, ':', dup);
                            if (dup.is_blank_dish === true) {
                                hasNewDishes = true;
                                console.log('EFE: Found new dish in duplication at index', index);
                            }
                        });
                    } else {
                        console.log('EFE: No duplications found in results');
                    }
                    
                    // Check for removals
                    if (results && results.removals && Array.isArray(results.removals) && results.removals.length > 0) {
                        console.log('EFE: Found removals:', results.removals.length);
                        hasRemovals = true;
                    }
                    
                    if (hasNewDishes) {
                        // For new dishes, we need to reload to show them properly
                        console.log('EFE: New dishes detected, will reload page');
                        EFE.Utils.showNotification('Nuovo piatto creato con successo! Ricaricamento...', 'success');
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else if (hasDuplications || hasRemovals) {
                        // For duplications and removals, we need to reload to show changes properly
                        console.log('EFE: Duplications or removals detected, will reload page');
                        EFE.Utils.showNotification('Modifiche applicate con successo! Ricaricamento...', 'success');
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        // Check if there are pending duplications in the DOM (fallback)
                        const pendingDuplications = $('.efe-pending-duplication[data-section-id^="dup-section-"]').length;
                        const newDishDuplications = $('.efe-pending-duplication[data-section-id^="new-dish-"]').length;
                        const totalPendingDuplications = pendingDuplications + newDishDuplications;
                        const newDishWidgets = $('.efe-editable-widget[data-is-new-dish="true"]').length;
                        
                        console.log('EFE: DOM check - pendingDuplications:', pendingDuplications, 'newDishDuplications:', newDishDuplications, 'newDishWidgets:', newDishWidgets);
                        
                        if (totalPendingDuplications > 0 || newDishWidgets > 0) {
                            console.log('EFE: Found pending duplications in DOM, forcing reload');
                            EFE.Utils.showNotification('Nuovo piatto creato con successo! Ricaricamento...', 'success');
                            setTimeout(function() {
                                location.reload();
                            }, 1000);
                        } else {
                            // Additional check: if we have widget changes that belong to new dishes
                            const changes = EFE.EditorManager.getChanges();
                            let hasNewDishChanges = false;
                            
                            if (changes && changes.widgets) {
                                for (const widgetId in changes.widgets) {
                                    const widgetData = changes.widgets[widgetId];
                                    if (widgetData.isNewDish === true) {
                                        hasNewDishChanges = true;
                                        console.log('EFE: Found new dish widget changes, forcing reload');
                                        break;
                                    }
                                }
                            }
                            
                            if (hasNewDishChanges) {
                                EFE.Utils.showNotification('Nuovo piatto creato con successo! Ricaricamento...', 'success');
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            } else {
                                // For regular changes, just show success message
                                console.log('EFE: No new dishes detected, showing success message');
                                EFE.Utils.showNotification('Modifiche salvate con successo!', 'success');
                            }
                        }
                    }
                } else {
                    EFE.Utils.showNotification('Errore durante il salvataggio', 'error');
                    // Restore beforeunload handler in case of error
                    this.setupBeforeUnloadHandler();
                }
                
                // Hide loading overlay in case of error too
                EFE.EditorManager.hideLoadingOverlay();

                if (typeof callback === 'function') {
                    callback(response);
                }
            }.bind(this));
        },

        // Add this helper method
        setupBeforeUnloadHandler: function() {
            $(window).off('beforeunload');
            $(window).on('beforeunload', function(e) {
                if (EFE.EditorManager.isEditModeActive() && EFE.EditorManager.hasUnsavedChanges()) {
                    e.preventDefault();
                    return efe_data.strings.confirm_exit;
                }
            });
        },
        
        toggleEditMode: function() {
            if (editMode) {
                // If we're exiting edit mode
                if (hasUnsavedChanges) {
                    if (confirm('Salvare le modifiche?')) {
                        this.saveAllChanges();
                    } else {
                        this.clearChanges();
                        this._toggleEditModeInternal();
                    }
                } else {
                    // No changes, just exit
                    this._toggleEditModeInternal();
                }
            } else {
                // Just enter edit mode
                this._toggleEditModeInternal();
            }
        },
        
                /**
         * Show loading overlay
         */
        showLoadingOverlay: function() {
            const $overlay = $('#efe-loading-overlay');
            if ($overlay.length === 0) {
                console.error('EFE: Loading overlay element not found!');
                return;
            }
            
            // Debug: check where the element is positioned
            console.log('EFE: Loading overlay found, position:', $overlay.position());
            console.log('EFE: Loading overlay CSS display:', $overlay.css('display'));
            console.log('EFE: Loading overlay CSS z-index:', $overlay.css('z-index'));
            
            // Force apply styles directly and remove inline display:none
            $overlay.removeAttr('style'); // Remove the inline style="display: none !important;"
            $overlay.css({
                'display': 'flex',
                'position': 'fixed',
                'top': '0',
                'left': '0',
                'width': '100vw',
                'height': '100vh',
                'background': 'rgba(0, 0, 0, 0.8)',
                'z-index': '9999999',
                'justify-content': 'center',
                'align-items': 'center',
                'flex-direction': 'column'
            });
            
            // Force apply styles to child elements
            $overlay.find('.efe-loading-text').css({
                'color': 'white',
                'font-size': '18px',
                'font-weight': 'bold',
                'text-align': 'center',
                'margin-bottom': '10px',
                'background': 'rgba(0, 0, 0, 0.7)',
                'padding': '10px 20px',
                'border-radius': '8px',
                'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.5)',
                'box-shadow': '0 4px 8px rgba(0, 0, 0, 0.3)'
            });
            
            $overlay.find('.efe-loading-subtext').css({
                'color': '#e0e0e0',
                'font-size': '14px',
                'text-align': 'center',
                'background': 'rgba(0, 0, 0, 0.6)',
                'padding': '8px 16px',
                'border-radius': '6px',
                'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.5)',
                'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.2)'
            });
            
            $overlay.addClass('efe-active');
            $('body').addClass('efe-loading');
            console.log('EFE: Loading overlay shown');
        },
        
        /**
         * Hide loading overlay
         */
        hideLoadingOverlay: function() {
            const $overlay = $('#efe-loading-overlay');
            $overlay.removeClass('efe-active');
            $overlay.attr('style', 'display: none !important;'); // Restore the original inline style
            $('body').removeClass('efe-loading');
            console.log('EFE: Loading overlay hidden');
        },
        
        /**
         * Refresh all attribute indicators based on current values
         * Called after any DOM-altering operation
         */
        refreshAttributeIndicators: function() {
    
    
    // Loop through all sections with our data attributes
    $('[data-vegetarian], [data-chef-special], [data-gluten-free], [data-spicy], [data-allergen-gluten]').each(function() {
        const $section = $(this);
        const sectionId = $section.data('section-id');
        
        if (!sectionId) return;
        
        
        // Handle dish attributes
        const vegetarianAttr = $section.attr('data-vegetarian');
        const chefSpecialAttr = $section.attr('data-chef-special'); 
        const glutenFreeAttr = $section.attr('data-gluten-free');
        const spicyAttr = $section.attr('data-spicy');
        
        // Forcefully process dish attribute icons
        if (vegetarianAttr !== undefined) {
            const isVisible = vegetarianAttr === 'true';
            $section.find('[id*="vegetarian"], [class*="vegetarian"]').each(function() {
                if (isVisible) {
                    $(this).removeClass('efe-hidden-icon').css('display', 'inline-block');
                    this.style.setProperty('display', 'inline-block', 'important');
                    this.style.setProperty('visibility', 'visible', 'important');
                } else {
                    $(this).addClass('efe-hidden-icon').css('display', 'none');
                    this.style.setProperty('display', 'none', 'important');
                    this.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }
        
        if (chefSpecialAttr !== undefined) {
            const isVisible = chefSpecialAttr === 'true';
            $section.find('[id*="chef-special"], [class*="chef-special"]').each(function() {
                if (isVisible) {
                    $(this).removeClass('efe-hidden-icon').css('display', 'inline-block');
                    this.style.setProperty('display', 'inline-block', 'important');
                    this.style.setProperty('visibility', 'visible', 'important');
                } else {
                    $(this).addClass('efe-hidden-icon').css('display', 'none');
                    this.style.setProperty('display', 'none', 'important');
                    this.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }
        
        if (glutenFreeAttr !== undefined) {
            const isVisible = glutenFreeAttr === 'true';
            $section.find('[id*="gluten-free"], [class*="gluten-free"]').each(function() {
                if (isVisible) {
                    $(this).removeClass('efe-hidden-icon').css('display', 'inline-block');
                    this.style.setProperty('display', 'inline-block', 'important');
                    this.style.setProperty('visibility', 'visible', 'important');
                } else {
                    $(this).addClass('efe-hidden-icon').css('display', 'none');
                    this.style.setProperty('display', 'none', 'important');
                    this.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }
        
        if (spicyAttr !== undefined) {
            const isVisible = spicyAttr === 'true';
            $section.find('[id*="spicy"], [class*="spicy"]').each(function() {
                if (isVisible) {
                    $(this).removeClass('efe-hidden-icon').css('display', 'inline-block');
                    this.style.setProperty('display', 'inline-block', 'important');
                    this.style.setProperty('visibility', 'visible', 'important');
                } else {
                    $(this).addClass('efe-hidden-icon').css('display', 'none'); 
                    this.style.setProperty('display', 'none', 'important');
                    this.style.setProperty('visibility', 'hidden', 'important');
                }
            });
        }
        
        // Handle allergen attributes
        const allergens = [
            'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
            'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
        ];
        
        allergens.forEach(function(allergen) {
            const attrName = 'data-allergen-' + allergen;
            const allergenAttr = $section.attr(attrName);
            
            if (allergenAttr !== undefined) {
                const isVisible = allergenAttr === 'true';
                $section.find('[id*="allergen-' + allergen + '"], [class*="allergen-' + allergen + '"]').each(function() {
                    if (isVisible) {
                        $(this).removeClass('efe-hidden-icon').css('display', 'inline-block');
                        this.style.setProperty('display', 'inline-block', 'important');
                        this.style.setProperty('visibility', 'visible', 'important');
                    } else {
                        $(this).addClass('efe-hidden-icon').css('display', 'none');
                        this.style.setProperty('display', 'none', 'important');
                        this.style.setProperty('visibility', 'hidden', 'important');
                    }
                });
            }
        });
    });
    
    
},
        
        /**
         * Internal function to toggle edit mode without checks
         */
        _toggleEditModeInternal: function() {
            editMode = !editMode;
            
            
            
            if (editMode) {
                // Activate edit mode
                $('#efe-edit-toggle').addClass('active');
                $('#toggle-elementor-edit').text('Salva ed Esci');
                
                // Show global currency button
                $('#efe-global-currency-btn').show();
                
                // Add class to body
                $('body').addClass('efe-editing-mode');
                
                // Add style to editable elements
                $('.efe-editable-widget').addClass('efe-editable');
                
                // Add controls to editable sections
    
                $('.efe-editable-section, .duplicable, [data-duplicable="true"], [data-efe-duplicable="true"]').each(function() {
                    const $this = $(this);
                    
                    // Add section ID if missing
                    if (!$this.data('section-id') && $this.data('id')) {
                        $this.attr('data-section-id', $this.data('id'));

                    }
                    
                    // Add controls only if section has ID
                    if ($this.data('section-id')) {
                        EFE.SectionManager.addSectionControls($this);
                    } else {
                        console.warn('Element without data-section-id:', $this);
                    }
                });
                
                // Show info notification
                EFE.Utils.showNotification('Clicca su un elemento per modificarlo', 'info');
                
                
                
                // Show warning if no editable elements found
                if ($('.efe-editable-widget').length === 0 && $('.efe-editable-section').length === 0) {
                    console.warn('No editable elements found in page');
                    EFE.Utils.showNotification('Nessun elemento modificabile trovato nella pagina. Assicurati di aver aggiunto la classe "editable" ai widget e "duplicable" alle sezioni che vuoi rendere duplicabili.', 'warning');
                }
                        
                // IMPORTANT: Delay attribute refresh to ensure it overrides Elementor's CSS
                setTimeout(() => {
                    this.refreshAttributeIndicators();
                }, 100);
            } else {
                // Deactivate edit mode
                $('#efe-edit-toggle').removeClass('active');
                $('#toggle-elementor-edit').text('Modifica Contenuti');
                
                // Hide global currency button
                $('#efe-global-currency-btn').hide();
                
                // Remove class from body
                $('body').removeClass('efe-editing-mode');
                
                // Remove styles from editable elements
                $('.efe-editable-widget').removeClass('efe-editable efe-highlight');
                
                // Remove section controls
                $('.efe-section-controls').remove();
                $('.efe-editable-section').removeClass('efe-section-hover');
                
                // Close all open modals
                EFE.ModalHandler.closeModals();
                
                // Reset unsaved changes flag - this is now handled by clearChanges()
                hasUnsavedChanges = false;
            }
        }
    };
})(jQuery);