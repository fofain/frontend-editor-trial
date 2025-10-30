/**
 * Section Manager Module for Elementor Menu Frontend Editor
 * Handles operations on sections like duplication, deletion and movement
 */
var EFE = EFE || {};

EFE.SectionManager = (function($) {
    'use strict';
    
    // Private variables
    let currentSectionId = null; // To track current section for deletion
    
    // Helper functions for category detection and validation
    
    /**
     * Check if an element is a category section
     * @param {jQuery} $element - The element to check
     * @returns {boolean} - True if the element is a category section
     */
    function isCategorySection($element) {
        if (!$element || !$element.length) {
            return false;
        }
        
        // Primary check: modern category section class
        if ($element.hasClass('efe-category-section')) {
            return true;
        }
        
        // Check for category data attribute (multiple formats for backward compatibility)
        if ($element.data('is-category') === 'true' || 
            $element.data('is-category') === true ||
            $element.attr('data-is-category') === 'true') {
            return true;
        }
        
        // Legacy category class support
        if ($element.hasClass('category')) {
            return true;
        }
        
        // Additional legacy checks for older implementations
        if ($element.hasClass('menu-category') || 
            $element.hasClass('category-section') ||
            $element.hasClass('elementor-category')) {
            return true;
        }
        
        // Check for legacy data attributes
        if ($element.attr('data-category') === 'true' ||
            $element.attr('data-section-type') === 'category' ||
            $element.data('section-type') === 'category') {
            return true;
        }
        
        // Check if element contains category title widgets (fallback detection)
        if ($element.find('.elementor-widget[class*="category-title"]').length > 0 ||
            $element.find('[data-widget-type*="category"]').length > 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Validate if a category movement is allowed
     * @param {jQuery} $section - The section being moved
     * @param {string} direction - Movement direction ('up' or 'down')
     * @returns {Object} - Validation result with canMove, reason, messageType, and messageText
     */
    function validateCategoryMovement($section, direction) {
        const isCategory = isCategorySection($section);
        
        if (direction === 'up') {
            const $prev = $section.prev();
            
            // If no previous element, we're at the top
            if (!$prev.length) {
                return {
                    canMove: false,
                    reason: 'at_top_boundary',
                    messageType: 'warning',
                    messageText: isCategory ? 'La categoria è già in cima alla pagina' : 'La sezione è già in cima'
                };
            }
            
            // For categories, check if we can move above another category
            if (isCategory) {
                // Skip non-category elements to find the actual previous category
                let $prevCategory = $prev;
                while ($prevCategory.length && !isCategorySection($prevCategory)) {
                    $prevCategory = $prevCategory.prev();
                }
                
                // If we found a previous category, movement is allowed
                if ($prevCategory.length && isCategorySection($prevCategory)) {
                    return {
                        canMove: true,
                        reason: 'valid_category_movement',
                        messageType: 'success',
                        messageText: 'Categoria spostata verso l\'alto'
                    };
                }
                
                // If no previous category found, we're at the top boundary
                return {
                    canMove: false,
                    reason: 'at_top_boundary',
                    messageType: 'warning',
                    messageText: 'La categoria è già la prima categoria'
                };
            }
            
            // For non-category sections, check if we're moving within the same category
            const $currentCategory = $section.closest('.efe-category-section');
            if ($currentCategory.length) {
                const $prevCategory = $prev.closest('.efe-category-section');
                
                // If both are in the same category, allow movement
                if ($prevCategory.length && 
                    $currentCategory.data('section-id') === $prevCategory.data('section-id')) {
                    return {
                        canMove: true,
                        reason: 'valid_within_category',
                        messageType: 'success',
                        messageText: 'Sezione spostata verso l\'alto'
                    };
                }
                
                // If trying to move outside category boundary, prevent
                return {
                    canMove: false,
                    reason: 'category_boundary',
                    messageType: 'warning',
                    messageText: 'Non è possibile spostare la sezione oltre i confini della categoria'
                };
            }
            
            // For sections not in a category, allow general movement
            return {
                canMove: true,
                reason: 'valid_movement',
                messageType: 'success',
                messageText: 'Sezione spostata verso l\'alto'
            };
            
        } else { // direction === 'down'
            const $next = $section.next();
            
            // If no next element, we're at the bottom
            if (!$next.length) {
                return {
                    canMove: false,
                    reason: 'at_bottom_boundary',
                    messageType: 'warning',
                    messageText: isCategory ? 'La categoria è già in fondo alla pagina' : 'La sezione è già in fondo'
                };
            }
            
            // For categories, check if we can move below another category
            if (isCategory) {
                // Skip non-category elements to find the actual next category
                let $nextCategory = $next;
                while ($nextCategory.length && !isCategorySection($nextCategory)) {
                    $nextCategory = $nextCategory.next();
                }
                
                // If we found a next category, movement is allowed
                if ($nextCategory.length && isCategorySection($nextCategory)) {
                    return {
                        canMove: true,
                        reason: 'valid_category_movement',
                        messageType: 'success',
                        messageText: 'Categoria spostata verso il basso'
                    };
                }
                
                // If no next category found, we're at the bottom boundary
                return {
                    canMove: false,
                    reason: 'at_bottom_boundary',
                    messageType: 'warning',
                    messageText: 'La categoria è già l\'ultima categoria'
                };
            }
            
            // For non-category sections, check if we're moving within the same category
            const $currentCategory = $section.closest('.efe-category-section');
            if ($currentCategory.length) {
                const $nextCategory = $next.closest('.efe-category-section');
                
                // If both are in the same category, allow movement
                if ($nextCategory.length && 
                    $currentCategory.data('section-id') === $nextCategory.data('section-id')) {
                    return {
                        canMove: true,
                        reason: 'valid_within_category',
                        messageType: 'success',
                        messageText: 'Sezione spostata verso il basso'
                    };
                }
                
                // If trying to move outside category boundary, prevent
                return {
                    canMove: false,
                    reason: 'category_boundary',
                    messageType: 'warning',
                    messageText: 'Non è possibile spostare la sezione oltre i confini della categoria'
                };
            }
            
            // For sections not in a category, allow general movement
            return {
                canMove: true,
                reason: 'valid_movement',
                messageType: 'success',
                messageText: 'Sezione spostata verso il basso'
            };
        }
    }
    
    /**
     * Get adjacent category sections for a given section
     * @param {jQuery} $section - The section to find adjacent categories for
     * @returns {Object} - Object with previous and next category sections
     */
    function getAdjacentCategorySections($section) {
        const result = {
            previous: null,
            next: null
        };
        
        // Find previous category section
        let $prev = $section.prev();
        while ($prev.length) {
            if (isCategorySection($prev)) {
                result.previous = $prev;
                break;
            }
            $prev = $prev.prev();
        }
        
        // Find next category section
        let $next = $section.next();
        while ($next.length) {
            if (isCategorySection($next)) {
                result.next = $next;
                break;
            }
            $next = $next.next();
        }
        
        return result;
    }
    
    /**
     * Ensure backward compatibility by normalizing section attributes
     * @param {jQuery} $section - The section to normalize
     */
    function ensureBackwardCompatibility($section) {
        if (!$section || !$section.length) {
            return;
        }
        
        // If this is detected as a category but doesn't have modern attributes, add them
        if (isCategorySection($section)) {
            // Ensure modern class is present
            if (!$section.hasClass('efe-category-section')) {
                $section.addClass('efe-category-section');
            }
            
            // Ensure modern data attribute is present
            if (!$section.attr('data-is-category')) {
                $section.attr('data-is-category', 'true');
            }
        }
        
        // Ensure section has proper editable class for controls
        if (!$section.hasClass('efe-editable-section')) {
            // Check if it has legacy editable classes
            if ($section.hasClass('editable-section') || 
                $section.hasClass('elementor-section') ||
                $section.find('.elementor-widget').length > 0) {
                $section.addClass('efe-editable-section');
            }
        }
        
        // Ensure section has an ID for proper functionality
        if (!$section.data('section-id') && !$section.attr('data-section-id')) {
            // Try to get ID from various legacy sources
            let sectionId = $section.attr('id') || 
                           $section.data('id') || 
                           $section.attr('data-id') ||
                           $section.attr('data-elementor-id');
            
            if (sectionId) {
                $section.attr('data-section-id', sectionId);
            } else {
                // Generate a temporary ID if none exists
                const tempId = 'legacy-section-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                $section.attr('data-section-id', tempId);
                console.warn('Generated temporary ID for section without identifier:', tempId);
            }
        }
    }
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        
        init: function() {
    
            this.setupEventHandlers();
        },

        setupEventHandlers: function() {
            // Section control events
            $('body').on('click', '.efe-delete-section-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
                    e.stopPropagation();
                    EFE.SectionManager.confirmDeleteSection($(this).closest('.efe-editable-section'));
                }
            });

            $('body').on('click', '.efe-add-dish-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
        
                    EFE.SectionManager.addNewDish($(this).closest('.efe-editable-section'));
                }
            });

            $('body').on('click', '.efe-duplicate-section-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
                    e.stopPropagation();
                    EFE.SectionManager.duplicateSection($(this).closest('.efe-editable-section'));
                }
            });

            $('body').on('click', '.efe-move-up-btn, .efe-move-down-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
                    e.stopPropagation();
                    const direction = $(this).hasClass('efe-move-up-btn') ? 'up' : 'down';
                    EFE.SectionManager.moveSection($(this).closest('.efe-editable-section'), direction);
                }
            });

            $('body').on('click', '.efe-dish-attributes-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
                    e.stopPropagation();
                    if (typeof EFE.DishAttributes !== 'undefined' && EFE.DishAttributes.openEditor) {
                        EFE.DishAttributes.openEditor($(this).closest('.efe-editable-section'));
                    }
                }
            });

            $('body').on('click', '.efe-allergen-attributes-btn', function(e) {
                if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                    e.preventDefault(); e.stopPropagation();
                    e.stopPropagation();
                    if (typeof EFE.AllergenAttributes !== 'undefined' && EFE.AllergenAttributes.openEditor) {
                        EFE.AllergenAttributes.openEditor($(this).closest('.efe-editable-section'));
                    }
                }
            });
        },
          
        
        /**
         * Add controls to a section
         */
        addSectionControls: function($section) {
            try {
                // Check if controls already exist
                if ($section.find('.efe-section-controls').length > 0) {
                    return;
                }
                
                // Ensure backward compatibility before proceeding
                ensureBackwardCompatibility($section);
                
                // Verify the section has an ID (after compatibility normalization)
                if (!$section.data('section-id') && !$section.attr('data-section-id')) {
                    console.warn('Section without ID - cannot add controls:', $section);
                    return;
                }
                
                // Store original state for potential rollback
                const originalClasses = $section.attr('class') || '';
                const originalAttributes = {};
                
                try {
                    // Add hover style class
                    $section.addClass('efe-section-hover');
                    
                    // Generate a unique ID for the controls
                    const controlsId = 'efe-section-controls-' + $section.data('section-id');
                    
                    // Check if this is a category section using comprehensive detection
                    const isCategory = isCategorySection($section);
                    
                    // Create different controls based on section type
                    let controlsHtml = '<div class="efe-section-controls" id="' + controlsId + '">' +
                                       '<button type="button" class="efe-section-toggle" title="Controlli sezione">⋮</button>' +
                                       '<div class="efe-section-buttons">';
                    
                    if (isCategory) {
                        // Category-specific controls - no "Attributi" button
                        controlsHtml += '<button type="button" class="efe-move-up-btn" title="Sposta categoria in alto">↑</button>' +
                                        '<button type="button" class="efe-move-down-btn" title="Sposta categoria in basso">↓</button>' +
                                        '<button type="button" class="efe-duplicate-section-btn" title="Duplica questa categoria">Duplica</button>' +
                                        '<button type="button" class="efe-add-dish-btn" title="Aggiungi nuovo piatto">Aggiungi piatto</button>' +
                                        '<button type="button" class="efe-delete-section-btn" title="Elimina questa categoria">Elimina</button>';
                        
                        // Store original attributes before modification
                        originalAttributes['data-is-category'] = $section.attr('data-is-category');
                        
                        // Mark this as a category section
                        $section.addClass('efe-category-section');
                        $section.attr('data-is-category', 'true');
                    } else {
                        // Regular section controls with dish attributes
                        // Check if this section is inside a category section
                        const $parentCategory = $section.closest('.efe-category-section');
                        const categoryId = $parentCategory.length ? $parentCategory.data('section-id') : '';
                        
                        controlsHtml += '<button type="button" class="efe-move-up-btn" title="Sposta in alto">↑</button>' +
                                        '<button type="button" class="efe-move-down-btn" title="Sposta in basso">↓</button>' +
                                        '<button type="button" class="efe-duplicate-section-btn" title="Duplica questa sezione">Duplica</button>' +
                                        '<button type="button" class="efe-delete-section-btn" title="Elimina questa sezione">Elimina</button>' +
                                        '<button type="button" class="efe-dish-attributes-btn" title="Imposta attributi piatto">Attributi</button>' +
                                        '<button type="button" class="efe-allergen-attributes-btn" title="Imposta allergeni">Allergeni</button>';
                                        
                        if (categoryId) {
                            // Store original attribute before modification
                            originalAttributes['data-parent-category'] = $section.attr('data-parent-category');
                            
                            // Store the parent category ID as data attribute
                            $section.attr('data-parent-category', categoryId);
                        }
                    }
                    
                    controlsHtml += '</div></div>';
                    
                    // Add controls to the section
                    $section.prepend($(controlsHtml));
                    
                } catch (domError) {
                    console.error('DOM manipulation failed during addSectionControls:', domError);
                    
                    // Attempt to restore original state
                    try {
                        // Remove any controls that might have been partially added
                        $section.find('.efe-section-controls').remove();
                        
                        // Restore original classes
                        $section.attr('class', originalClasses);
                        
                        // Restore original attributes
                        Object.keys(originalAttributes).forEach(attr => {
                            if (originalAttributes[attr] !== undefined) {
                                $section.attr(attr, originalAttributes[attr]);
                            } else {
                                $section.removeAttr(attr);
                            }
                        });
                        
                        console.warn('Failed to add section controls, original state restored');
                    } catch (restoreError) {
                        console.error('Failed to restore section state after controls addition failure:', restoreError);
                    }
                }
                
            } catch (error) {
                console.error('Critical error in addSectionControls:', error);
            }
        },
        
        moveSection: function($section, direction) {
            try {
                // Ensure backward compatibility before proceeding
                ensureBackwardCompatibility($section);
                
                // Try to get ID in different ways
                let sectionId = $section.data('section-id') || $section.attr('data-section-id');
                if (!sectionId) {
                    sectionId = $section.data('id') || $section.attr('id') || $section.attr('data-id');
                }
            
                const postId = $section.data('post-id') || $section.attr('data-post-id');
                const isCategory = isCategorySection($section);
            
                // Check if this section is inside a category
                const $parentCategory = $section.closest('.efe-category-section');
                const parentCategory = $parentCategory.length ? $parentCategory.data('section-id') : $section.data('parent-category') || '';
            
                if (!sectionId || !postId) {
                    console.error('Missing section details:', $section);
                    
                    const sectionType = isCategory ? 'categoria' : 'sezione';
                    EFE.Utils.showNotification(`Impossibile identificare la ${sectionType} da spostare. Riprova o ricarica la pagina.`, 'error');
                    return;
                }
            
                // Validate movement using proper category section boundary detection
                const validation = validateCategoryMovement($section, direction);
                
                if (!validation.canMove) {
                    EFE.Utils.showNotification(validation.messageText, validation.messageType);
                    return;
                }
                
                // Store original position for potential rollback
                const $originalParent = $section.parent();
                const $originalNext = $section.next();
                const $originalPrev = $section.prev();
                
                // Perform the actual movement with error handling
                try {
                    if (direction === 'up') {
                        const $prev = $section.prev();
                        if ($prev.length) {
                            $prev.before($section);
                        } else {
                            throw new Error('No previous element found for upward movement');
                        }
                    } else {
                        const $next = $section.next();
                        if ($next.length) {
                            $next.after($section);
                        } else {
                            throw new Error('No next element found for downward movement');
                        }
                    }
                    
                    // Verify the movement was successful by checking new position
                    const newPosition = $section.index();
                    const expectedChange = direction === 'up' ? -1 : 1;
                    
                    // Store the change instead of saving immediately
                    EFE.EditorManager.addChange('movement', {
                        sectionId: sectionId,
                        postId: postId,
                        direction: direction,
                        isCategory: isCategory,
                        parentCategory: parentCategory
                    });
                
                    // Show success notification with the validation message
                    EFE.Utils.showNotification(validation.messageText, validation.messageType);
                    
                } catch (domError) {
                    console.error('DOM manipulation failed during section movement:', domError);
                    
                    // Attempt to restore original position
                    try {
                        if ($originalNext.length) {
                            $originalNext.before($section);
                        } else if ($originalPrev.length) {
                            $originalPrev.after($section);
                        } else {
                            $originalParent.append($section);
                        }
                        
                        const sectionType = isCategory ? 'categoria' : 'sezione';
                        EFE.Utils.showNotification(`Errore durante lo spostamento della ${sectionType}. Posizione ripristinata. Riprova o ricarica la pagina.`, 'error');
                    } catch (restoreError) {
                        console.error('Failed to restore original position:', restoreError);
                        EFE.Utils.showNotification('Errore critico durante lo spostamento. Ricarica la pagina per ripristinare lo stato originale.', 'error');
                    }
                }
                
            } catch (error) {
                console.error('Critical error in moveSection:', error);
                const sectionType = $section && $section.hasClass && $section.hasClass('efe-category-section') ? 'categoria' : 'sezione';
                EFE.Utils.showNotification(`Errore imprevisto durante lo spostamento della ${sectionType}. Ricarica la pagina e riprova.`, 'error');
            }
        },
        
        /**
         * Confirm deletion of a section
         */
        confirmDeleteSection: function($section) {
            currentSectionId = $section.data('section-id');
            
            if (!currentSectionId) {
                console.error('Missing section ID:', $section);
                
                // Try alternative IDs
                currentSectionId = $section.attr('data-id') || $section.attr('id');
                if (!currentSectionId) {
                    EFE.Utils.showNotification('Impossibile identificare la sezione da eliminare. Riprova o ricarica la pagina.', 'error');
                    return;
                }
            }
            
            // Show confirmation modal
            $('#efe-section-delete-confirm').show();
        },
        
        /**
         * Delete the current section
         */
        deleteCurrentSection: function() {
            try {
                if (!currentSectionId) {
                    EFE.Utils.showNotification('Impossibile eliminare: sezione non identificata. Riprova.', 'error');
                    return;
                }
                
                // Find the section element
                const $section = $('.efe-editable-section[data-section-id="' + currentSectionId + '"]');
                if (!$section.length) {
                    EFE.Utils.showNotification('Sezione non trovata. La pagina potrebbe essere cambiata. Ricarica e riprova.', 'error');
                    EFE.ModalHandler.closeModals();
                    return;
                }
                
                const postId = $section.data('post-id');
                const isCategory = $section.data('is-category') === 'true' || $section.hasClass('efe-category-section');
                const parentCategory = $section.data('parent-category') || '';
                
                if (!postId) {
                    const sectionType = isCategory ? 'categoria' : 'sezione';
                    EFE.Utils.showNotification(`Impossibile eliminare la ${sectionType}: dati mancanti. Ricarica la pagina e riprova.`, 'error');
                    EFE.ModalHandler.closeModals();
                    return;
                }
                
                // Store original styles for potential rollback
                const originalOpacity = $section.css('opacity');
                const originalClasses = $section.attr('class');
                
                try {
                    // Hide the section visually without removing from DOM
                    $section.css('opacity', 0.3).addClass('efe-pending-deletion');
                    
                    // Store the change
                    EFE.EditorManager.addChange('removal', {
                        sectionId: currentSectionId,
                        postId: postId,
                        isCategory: isCategory,
                        parentCategory: parentCategory
                    });
                    
                    // Show notification
                    const sectionType = isCategory ? 'Categoria' : 'Sezione';
                    EFE.Utils.showNotification(`${sectionType} contrassegnata per l'eliminazione`, 'success');
                    
                } catch (domError) {
                    console.error('DOM manipulation failed during section deletion:', domError);
                    
                    // Attempt to restore original appearance
                    try {
                        $section.css('opacity', originalOpacity);
                        $section.removeClass('efe-pending-deletion');
                        
                        const sectionType = isCategory ? 'categoria' : 'sezione';
                        EFE.Utils.showNotification(`Errore durante l'eliminazione della ${sectionType}. Operazione annullata. Riprova.`, 'error');
                    } catch (restoreError) {
                        console.error('Failed to restore section appearance:', restoreError);
                        EFE.Utils.showNotification('Errore critico durante l\'eliminazione. Ricarica la pagina per ripristinare lo stato originale.', 'error');
                    }
                }
                
                // Close modal regardless of success/failure
                EFE.ModalHandler.closeModals();
                
            } catch (error) {
                console.error('Critical error in deleteCurrentSection:', error);
                EFE.Utils.showNotification('Errore imprevisto durante l\'eliminazione. Ricarica la pagina e riprova.', 'error');
                EFE.ModalHandler.closeModals();
            }
        },
        
        duplicateSection: function($section, isNewDish = false) {
            // Get section data
            let sectionId = $section.data('section-id');
            if (!sectionId) {
                sectionId = $section.data('id') || $section.attr('id');
            }

            const postId = $section.data('post-id');
            const isCategory = $section.data('is-category') === 'true' || $section.hasClass('efe-category-section');
            const parentCategory = isCategory ? '' : $section.data('parent-category') || $section.closest('.efe-category-section').data('section-id') || '';

            if (!sectionId || !postId) {
                const sectionType = isCategory ? 'categoria' : 'sezione';
                EFE.Utils.showNotification(`Impossibile identificare la ${sectionType} da duplicare. Riprova o ricarica la pagina.`, 'error');
                return;
            }

            if (isCategory) {
                // --- CATEGORY: Use AJAX duplication, then save and exit/reload ---
                EFE.Utils.showNotification('Duplicazione categoria in corso...', 'info');
                EFE.AjaxHandler.duplicateSection(sectionId, postId, function(response) {
                    if (response && response.success && response.data && response.data.new_section_id) {

                        EFE.Utils.showNotification('Categoria duplicata con successo! Salvataggio in corso...', 'success');
                        // Save and exit/reload after duplication
                        if (EFE.EditorManager && typeof EFE.EditorManager.saveAllChanges === 'function') {
                            EFE.EditorManager.saveAllChanges();
                        }
                    } else {
                        EFE.Utils.showNotification('Errore nella duplicazione della categoria. Riprova o ricarica la pagina.', 'error');
                    }
                });
            } else {
                // --- REGULAR ITEM: Use old DOM-based duplication method ---
            // Create a unique ID for this duplication operation
            const operationId = isNewDish ? 'newdish-' + Date.now() + '-' + Math.floor(Math.random() * 1000) : 'dup-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            const duplicateClass = 'efe-duplicate-' + operationId;
            const $newSection = $section.clone(false);
            $newSection.find('[id]').removeAttr('id');
            $newSection.find('[data-id]').removeAttr('data-id');
            $newSection.find('[data-elementor-id]').removeAttr('data-elementor-id');
            $newSection.find('[data-widget-id]').removeAttr('data-widget-id');
            $newSection.removeAttr('id');
            $newSection.removeAttr('data-id');
            $newSection.removeAttr('data-elementor-id');
            $newSection.removeAttr('data-widget-id');
            $newSection.attr('data-section-id', 'dup-section-' + operationId);
            $newSection.attr('data-original-section-id', sectionId);
            $newSection.attr('data-operation-id', operationId);
            $newSection.attr('data-post-id', postId);
            $newSection.addClass(duplicateClass);
            $newSection.addClass('efe-pending-duplication');
            $newSection.find('.efe-editable-widget').each(function(index) {
                const $widget = $(this);
                const originalWidgetId = $widget.data('widget-id') || '';
                const dupWidgetId = isNewDish ? 'temp-widget-' + operationId + '-' + index : 'efe-dup-widget-' + operationId + '-' + index;
                $widget.removeAttr('id');
                $widget.removeAttr('data-id');
                $widget.removeAttr('data-elementor-id');
                $widget.removeAttr('data-widget-id');
                $widget.attr('data-widget-id', dupWidgetId);
                $widget.attr('data-original-widget-id', originalWidgetId);
                $widget.attr('data-index', index);
                $widget.attr('data-operation-id', operationId);
                $widget.addClass('efe-duplicate-widget');
                
                // For new dishes, clear content and set placeholders
                if (isNewDish) {
                    $widget.attr('data-is-new-dish', 'true');
                    const widgetType = $widget.data('widget-type');
                    
                    // Clear existing content
                    $widget.empty();
                    
                    // Set placeholder content based on widget type
                    switch (widgetType) {
                        case 'heading':
                            $widget.append('<h3>Scrivi il titolo qui...</h3>');
                            break;
                        case 'text-editor':
                            $widget.append('<div class="elementor-text-editor"><p>Scrivi il testo qui...</p></div>');
                            break;
                        case 'price-heading':
                            $widget.append('<h4>0€</h4>');
                            // Set default price settings
                            $widget.attr('data-price-settings', JSON.stringify({
                                price_value: '0',
                                currency: '€',
                                currency_position: 'after',
                                show_currency: true
                            }));
                            $widget.data('efe-price-settings', {
                                price_value: '0',
                                currency: '€',
                                currency_position: 'after',
                                show_currency: true
                            });
                            break;
                        case 'image':
                            $widget.append('<img src="/wp-content/plugins/elementor/assets/images/placeholder.png" alt="Placeholder" style="max-width: 100%; height: auto;">');
                            break;
                        default:
                            $widget.append('<div>Contenuto da modificare...</div>');
                    }
                    
                    // Immediately add this widget change to the changes store
                    const tempWidgetId = dupWidgetId;
                    const changeData = {
                        widgetId: tempWidgetId,
                        postId: $('body').data('post-id') || document.body.dataset.postId,
                        widgetType: widgetType,
                        isInDuplicate: true,
                        isNewDish: true,
                        operationId: operationId,
                        index: index,
                        duplicatedSectionId: 'dup-section-' + operationId
                    };
                    
                    // Add specific content based on widget type
                    switch (widgetType) {
                        case 'heading':
                            changeData.title = 'Scrivi il titolo qui...';
                            break;
                        case 'text-editor':
                            changeData.content = '<p>Scrivi il testo qui...</p>';
                            break;
                        case 'price-heading':
                            changeData.price_value = '0';
                            changeData.currency = '€';
                            changeData.currency_position = 'after';
                            changeData.show_currency = true;
                            break;
                        case 'image':
                            // For images, we need to keep the placeholder image, not reset to empty
                            changeData.imageId = '';
                            changeData.imageUrl = '/wp-content/plugins/elementor/assets/images/placeholder.png';
                            changeData.imageAlt = 'Placeholder';
                            break;
                    }
                    
                    // Add to changes store
                    if (EFE.EditorManager && EFE.EditorManager.addChange) {
                        EFE.EditorManager.addChange('widget', changeData);
                    }
                }
            });
            $newSection.css({
                'outline': '2px solid #4CAF50',
                'position': 'relative',
                'margin-top': '20px',
                'margin-bottom': '20px',
                'padding': '15px'
            });
            const bannerText = isNewDish ? 'NUOVO PIATTO (in attesa di salvataggio)' : 'DUPLICATO (in attesa di salvataggio)';
            const bannerColor = isNewDish ? '#2196F3' : '#4CAF50';
            const $banner = $('<div class="efe-duplicate-banner" style="background:' + bannerColor + '; color:white; padding:8px; text-align:center; margin-bottom:10px; font-weight:bold;">' + bannerText + '</div>');
            $newSection.prepend($banner);
            $newSection.find('.efe-section-controls').remove();
            $section.after($newSection);
            this.addSectionControls($newSection);
            // For new dishes, don't copy attributes (they should be reset)
            if (!isNewDish) {
                this.copyAttributesForPreview($section, $newSection);
            } else {
                // Set default attributes for new dishes
                $newSection.attr('data-vegetarian', 'false');
                $newSection.attr('data-chef-special', 'false');
                $newSection.attr('data-gluten-free', 'false');
                $newSection.attr('data-spicy', 'false');
                $newSection.attr('data-allergens', JSON.stringify([]));
            }
            if (EFE.EditorManager && EFE.EditorManager.getChanges) {
                const currentChanges = EFE.EditorManager.getChanges();
                const originalSectionId = sectionId;
                const newSectionId = 'dup-section-' + operationId;
                if (currentChanges.attributes) {
                    const dishAttributeKey = 'dish_' + originalSectionId;
                    if (currentChanges.attributes[dishAttributeKey]) {
                        const originalAttrChange = currentChanges.attributes[dishAttributeKey];
                        const duplicatedAttrChange = JSON.parse(JSON.stringify(originalAttrChange));
                        duplicatedAttrChange.sectionId = newSectionId;
                        EFE.EditorManager.addChange('attribute', duplicatedAttrChange);
                    }
                    const allergenAttributeKey = 'allergen_' + originalSectionId;
                    if (currentChanges.attributes[allergenAttributeKey]) {
                        const originalAllergenChange = currentChanges.attributes[allergenAttributeKey];
                        const duplicatedAllergenChange = JSON.parse(JSON.stringify(originalAllergenChange));
                        duplicatedAllergenChange.sectionId = newSectionId;
                        EFE.EditorManager.addChange('attribute', duplicatedAllergenChange);
                    }
                }
            }
            EFE.EditorManager.addChange('duplication', {
                sectionId: sectionId,
                postId: postId,
                isCategory: false,
                parentCategory: parentCategory,
                operationId: operationId,
                isNewBlankDish: isNewDish
            });
            $newSection.find('.duplicable, [data-duplicable="true"], [data-efe-duplicable="true"]').each(function() {
                const $innerSection = $(this);
                if ($innerSection.find('.efe-section-controls').length === 0) {
                    if (!$innerSection.data('section-id') && $innerSection.data('id')) {
                        $innerSection.attr('data-section-id', $innerSection.data('id'));
                    } else if (!$innerSection.data('section-id')) {
                        const innerId = 'dup-inner-' + operationId + '-' + Math.floor(Math.random() * 1000);
                        $innerSection.attr('data-section-id', innerId);
                    }
                    $innerSection.attr('data-post-id', postId);
                    $innerSection.addClass('efe-editable-section');
                    EFE.SectionManager.addSectionControls($innerSection);
                }
            });
            EFE.Utils.showNotification('Sezione duplicata', 'success');
            }
        },

        // New helper method to copy attributes for preview
        copyAttributesForPreview: function($sourceSection, $targetSection) {
            // Check if this is a new dish - if so, don't copy attributes
            const isNewDish = $targetSection.attr('data-section-id') && 
                             $targetSection.attr('data-section-id').startsWith('new-dish-');
            
            if (isNewDish) {
                // For new dishes, set default attributes (all false)
                $targetSection.attr('data-vegetarian', 'false');
                $targetSection.attr('data-chef-special', 'false');
                $targetSection.attr('data-gluten-free', 'false');
                $targetSection.attr('data-spicy', 'false');
                $targetSection.attr('data-allergens', JSON.stringify([]));
                
                // Update icon visibility for new dishes (all hidden)
                this.updateDuplicateIconsVisibility($targetSection, {
                    vegetarian: false,
                    chefSpecial: false,
                    glutenFree: false,
                    spicy: false,
                    allergens: []
                });
                
                return;
            }
            
            // UPDATED APPROACH: First check data attributes which reflect pending changes
            const hasDataAttrs = $sourceSection.attr('data-vegetarian') !== undefined;
            
            // Fallback to original logic if no data attributes
            const vegetarianVisible = !($sourceSection.find('[id*="vegetarian"], [class*="vegetarian"]').is(':hidden'));
            const chefSpecialVisible = !($sourceSection.find('[id*="chef-special"], [class*="chef-special"]').is(':hidden'));
            const glutenFreeVisible = !($sourceSection.find('[id*="gluten-free"], [class*="gluten-free"]').is(':hidden'));
            const spicyVisible = !($sourceSection.find('[id*="spicy"], [class*="spicy"]').is(':hidden'));
            
            // Apply visual state to duplicate section
            const iconSelectors = {
                vegetarian: '[id*="vegetarian"], [class*="vegetarian"]',
                chefSpecial: '[id*="chef-special"], [class*="chef-special"]',
                glutenFree: '[id*="gluten-free"], [class*="gluten-free"]',
                spicy: '[id*="spicy"], [class*="spicy"]'
            };
            
            Object.keys(iconSelectors).forEach(attr => {
                const isVisible = {vegetarian: vegetarianVisible, chefSpecial: chefSpecialVisible, 
                                  glutenFree: glutenFreeVisible, spicy: spicyVisible}[attr];
                const $icons = $targetSection.find(iconSelectors[attr]);
                    
                if ($icons.length > 0) {
                    if (isVisible) {
                        $icons.removeClass('efe-hidden-icon').show();
                        $icons.css('display', '');
                    } else {
                        $icons.addClass('efe-hidden-icon').hide();
                        $icons.css('display', 'none');
                    }
                }
            });
            
            // Similarly, handle allergens
            const allergens = [
                'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
                'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
            ];
            
            allergens.forEach(allergen => {
                const selector = `[id*="allergen-${allergen}"], [class*="allergen-${allergen}"]`;
                const sourceVisible = !($sourceSection.find(selector).is(':hidden'));
                const $targetIcons = $targetSection.find(selector);
                
                if ($targetIcons.length > 0) {
                    if (sourceVisible) {
                        $targetIcons.removeClass('efe-hidden-icon').show();
                        $targetIcons.css('display', '');
                    } else {
                        $targetIcons.addClass('efe-hidden-icon').hide();
                        $targetIcons.css('display', 'none');
                    }
                }
            });
        },

        /**
         * Update icon visibility in duplicated sections based on data attributes
         * @param {jQuery} $section - The section to update icons in
         * @param {Object} attributes - Object containing boolean values for each icon type
         */
        updateDuplicateIconsVisibility: function($section, attributes) {
            const selectorPrefixes = [
                '[id*="', '[class*="',
                ' [id*="', ' [class*="',
                ' i[class*="', ' span[class*="', ' div[class*="',
                ' .elementor-icon [class*="', ' .elementor-icon-wrapper [class*="'
            ];
            
            // Process each attribute with multiple selector attempts
            const attrMap = {
                'vegetarian': ['vegetarian', 'vegan'],
                'chefSpecial': ['chef-special', 'chef_special', 'special', 'chef'],
                'glutenFree': ['gluten-free', 'gluten_free', 'gf'],
                'spicy': ['spicy', 'hot', 'piccante']
            };
            
            // Process each attribute
            Object.keys(attrMap).forEach(attr => {
                // Build a comprehensive selector that tries ALL possible variations
                let selectors = [];
                
                // Generate all possible selector combinations
                attrMap[attr].forEach(keyword => {
                    selectorPrefixes.forEach(prefix => {
                        selectors.push(prefix + keyword + '"]');
                        selectors.push(prefix + 'dish-' + keyword + '"]');
                        
                        if (attr === 'glutenFree') {
                            selectors.push(prefix + 'gluten-free"]');
                            selectors.push(prefix + 'glutenfree"]');
                            selectors = selectors.filter(sel => !sel.includes('allergen-'));
                        }
                    });
                });
                
                const megaSelector = selectors.join(', ');
                const $icons = $section.find(megaSelector);
                
                if ($icons.length > 0) {
                    if (attributes[attr]) {
                        // FORCE SHOW
                        $icons.removeClass('efe-hidden-icon elementor-hidden');
                        $icons.css({'display': 'inline-block', 'visibility': 'visible', 'opacity': '1'});
                        $icons.each(function() {
                            this.style.setProperty('display', 'inline-block', 'important');
                            this.style.setProperty('visibility', 'visible', 'important');
                            this.style.setProperty('opacity', '1', 'important');
                        });
                    } else {
                        // FORCE HIDE
                        $icons.addClass('efe-hidden-icon');
                        $icons.css({'display': 'none', 'visibility': 'hidden'});
                        $icons.each(function() {
                            this.style.setProperty('display', 'none', 'important');
                            this.style.setProperty('visibility', 'hidden', 'important');
                        });
                    }
                }
            });
            
            // Handle allergen icons if present in the data attributes
            if (attributes.allergens) {
                const allergens = [
                    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
                    'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
                ];
                
                allergens.forEach(allergen => {
                    // Build comprehensive selector for each allergen
                    let allergenSelectors = [];
                    selectorPrefixes.forEach(prefix => {
                        allergenSelectors.push(prefix + "allergen-" + allergen + '"]');
                        allergenSelectors.push(prefix + "allergen_" + allergen + '"]');
                    });
                    
                    const allergenSelector = allergenSelectors.join(', ');
                    const $allergenIcons = $section.find(allergenSelector);
                    
                    if ($allergenIcons.length > 0) {
                        if (attributes.allergens.includes(allergen)) {
                            // FORCE SHOW
                            $allergenIcons.removeClass('efe-hidden-icon elementor-hidden');
                            $allergenIcons.css({'display': 'inline-block', 'visibility': 'visible', 'opacity': '1'});
                            $allergenIcons.each(function() {
                                this.style.setProperty('display', 'inline-block', 'important');
                                this.style.setProperty('visibility', 'visible', 'important');
                                this.style.setProperty('opacity', '1', 'important');
                            });
                        } else {
                            // FORCE HIDE
                            $allergenIcons.addClass('efe-hidden-icon');
                            $allergenIcons.css({'display': 'none', 'visibility': 'hidden'});
                            $allergenIcons.each(function() {
                                this.style.setProperty('display', 'none', 'important');
                                this.style.setProperty('visibility', 'hidden', 'important');
                            });
                        }
                    }
                });
            }
        },

        /**
         * Set up special event handlers for duplicated sections
         */
        setupDuplicateHandlers: function($duplicateSection, operationId) {
            // Add specific event handlers for widgets in this duplicated section
            const duplicateClass = '.efe-duplicate-' + operationId;

            // Override click handlers for widgets in this duplicate
            $(duplicateClass + ' .efe-editable-widget').off('click').on('click', function(e) {
                e.stopPropagation();

                if (!EFE.EditorManager.isEditModeActive()) {
                    return;
                }

                const $widget = $(this);
                const widgetId = $widget.data('widget-id');
                const widgetType = $widget.data('widget-type');

    

                // Highlight this widget
                $('.efe-highlight').removeClass('efe-highlight');
                $widget.addClass('efe-highlight');

                // Open editor with this specific widget
                if (EFE.WidgetEditor && EFE.WidgetEditor.openEditor) {
                    EFE.WidgetEditor.openEditor($widget);
                }
            });
        },
        
        /**
         * Get current section ID (for deletion)
         */
        getCurrentSectionId: function() {
            return currentSectionId;
        },
        
        /**
         * Set current section ID
         */
        setCurrentSectionId: function(sectionId) {
            currentSectionId = sectionId;
        },

        addNewDish: function($categorySection) {
            // Get category data
            const categoryId = $categorySection.data('section-id');
            const postId = $categorySection.data('post-id');
            
            if (!categoryId || !postId) {
                EFE.Utils.showNotification('Impossibile identificare la categoria', 'error');
                return;
            }

            // Find an existing dish to duplicate
            const $dishContainer = this.findDishContainer($categorySection);
            const $existingDish = $dishContainer.find('.efe-editable-section:not(.efe-category-section)').first();
            
            if (!$existingDish.length) {
                EFE.Utils.showNotification('Nessun piatto esistente trovato per la duplicazione', 'error');
                return;
            }
            
            console.log('EFE: Duplicating existing dish for new dish creation');
            
            // Use the existing duplication system instead of creating from scratch
            this.duplicateSection($existingDish, true); // true = mark as new dish
            
            EFE.Utils.showNotification('Nuovo piatto aggiunto. Ricorda di modificare i contenuti prima di salvare!', 'success');
        },

        /**
         * Find the container that holds dishes within a category
         */
        findDishContainer: function($categorySection) {
            // Look for common patterns in Elementor structure
            let $container = null;
            
            // Pattern 1: Direct child sections with duplicable class
            $container = $categorySection.find('> .elementor-section.efe-editable-section:not(.efe-category-section)');
            if ($container.length > 0) {
                return $container.first().parent();
            }
            
            // Pattern 2: Container with duplicable sections inside
            $container = $categorySection.find('.elementor-container .elementor-section.efe-editable-section:not(.efe-category-section)');
            if ($container.length > 0) {
                return $container.first().closest('.elementor-container');
            }
            
            // Pattern 3: Any container that has editable sections
            $container = $categorySection.find('[class*="container"] .efe-editable-section:not(.efe-category-section)');
            if ($container.length > 0) {
                return $container.first().closest('[class*="container"]');
            }
            
            // Pattern 4: Fallback - look for any element that contains other editable sections
            $container = $categorySection.find('.efe-editable-section:not(.efe-category-section)');
            if ($container.length > 0) {
                return $container.first().parent();
            }
            
            // Pattern 5: Last resort - use the category section itself
            return $categorySection;
        },

        /**
         * Create a visual preview of a blank dish that matches existing structure
         */
        createVisualBlankDish: function(categoryId, operationId, $dishContainer) {
            // Find an existing dish to use as template
            const $existingDish = $dishContainer.find('.efe-editable-section:not(.efe-category-section)').first();
            
            if ($existingDish.length === 0) {
                // No existing dishes found, create a basic structure
                return this.createBasicDishStructure(categoryId, operationId);
            }
            
            // Clone the existing dish structure but clear the content
            const $dish = $existingDish.clone(false);
            
            // Clear all IDs and data attributes to avoid conflicts
            $dish.find('[id]').removeAttr('id');
            $dish.find('[data-id]').removeAttr('data-id');
            $dish.find('[data-elementor-id]').removeAttr('data-elementor-id');
            $dish.find('[data-widget-id]').removeAttr('data-widget-id');
            $dish.removeAttr('id');
            $dish.removeAttr('data-id');
            $dish.removeAttr('data-elementor-id');
            $dish.removeAttr('data-widget-id');
            
            // Preserve all CSS classes and styles
            $dish.find('*').each(function() {
                const $element = $(this);
                // Keep all existing classes
                const existingClasses = $element.attr('class');
                if (existingClasses) {
                    $element.attr('class', existingClasses);
                }
                // Keep all existing styles
                const existingStyles = $element.attr('style');
                if (existingStyles) {
                    $element.attr('style', existingStyles);
                }
                // Keep all existing data attributes except the ones we need to change
                const existingDataAttrs = $element.data();
                for (const key in existingDataAttrs) {
                    if (!['widget-id', 'post-id', 'section-id', 'elementor-id'].includes(key)) {
                        $element.attr('data-' + key, existingDataAttrs[key]);
                    }
                }
            });
            
            // Ensure the dish itself maintains its styling
            const originalClasses = $existingDish.attr('class');
            if (originalClasses) {
                $dish.attr('class', originalClasses);
            }
            const originalStyles = $existingDish.attr('style');
            if (originalStyles) {
                $dish.attr('style', originalStyles);
            }
            
            // Ensure Elementor styles are applied
            $dish.find('.elementor-widget').each(function() {
                const $widget = $(this);
                const widgetType = $widget.data('widget-type');
                
                // Apply Elementor-specific classes based on widget type
                switch (widgetType) {
                    case 'heading':
                        $widget.addClass('elementor-widget-heading');
                        $widget.find('h1, h2, h3, h4, h5, h6').addClass('elementor-heading-title');
                        break;
                    case 'text-editor':
                        $widget.addClass('elementor-widget-text-editor');
                        $widget.find('.elementor-text-editor').addClass('elementor-clearfix');
                        break;
                    case 'image':
                        $widget.addClass('elementor-widget-image');
                        break;
                    case 'price-heading':
                        $widget.addClass('elementor-widget-heading');
                        $widget.find('h1, h2, h3, h4, h5, h6').addClass('elementor-heading-title');
                        break;
                }
            });
            
            // Set new data attributes
            $dish.attr('data-section-id', 'new-dish-' + operationId);
            $dish.attr('data-post-id', $('body').data('post-id'));
            $dish.attr('data-operation-id', operationId);
            $dish.attr('data-parent-category', categoryId);
            $dish.addClass('efe-pending-duplication');
            
            // Clear existing content and set placeholder content
            $dish.find('.efe-editable-widget').each(function(index) {
                const $widget = $(this);
                const widgetType = $widget.data('widget-type');
                
                // Generate a temporary widget ID for new dishes
                const tempWidgetId = 'temp-widget-' + operationId + '-' + index;
                $widget.attr('data-widget-id', tempWidgetId);
                $widget.attr('data-operation-id', operationId);
                $widget.attr('data-widget-index', index);
                $widget.attr('data-is-new-dish', 'true');
                
                // Clear any existing content and data attributes
                $widget.empty();
                $widget.removeAttr('data-vegetarian');
                $widget.removeAttr('data-chef-special');
                $widget.removeAttr('data-gluten-free');
                $widget.removeAttr('data-spicy');
                $widget.removeAttr('data-allergens');
                $widget.removeAttr('data-price-settings');
                $widget.removeData('efe-price-settings');
                
                // Add placeholder content based on widget type
                switch (widgetType) {
                    case 'heading':
                        $widget.append('<h3>Scrivi il titolo qui...</h3>');
                        break;
                    case 'text-editor':
                        $widget.append('<div class="elementor-text-editor"><p>Scrivi il testo qui...</p></div>');
                        break;
                    case 'price-heading':
                        $widget.append('<h4>0€</h4>');
                        // Set default price settings
                        $widget.attr('data-price-settings', JSON.stringify({
                            price_value: '0',
                            currency: '€',
                            currency_position: 'after',
                            show_currency: true
                        }));
                        $widget.data('efe-price-settings', {
                            price_value: '0',
                            currency: '€',
                            currency_position: 'after',
                            show_currency: true
                        });
                        break;
                    case 'image':
                        $widget.append('<img src="/wp-content/plugins/elementor/assets/images/placeholder.png" alt="Placeholder" style="max-width: 100%; height: auto; display: block;">');
                        break;
                    case 'price-table':
                    case 'price-list':
                        $widget.append('<div class="price">0€</div>');
                        break;
                    default:
                        $widget.append('<div>Contenuto da modificare...</div>');
                }
            });
            
            // Add visual indicator
            $dish.css({
                'outline': '2px dashed #4CAF50',
                'position': 'relative',
                'margin-top': '10px',
                'margin-bottom': '10px',
                'padding': '10px',
                'opacity': '0.8'
            });
            
            // Add an indicator banner
            const $banner = $('<div class="efe-new-dish-banner" style="background:#4CAF50; color:white; padding:8px; text-align:center; margin-bottom:10px; font-weight:bold; border-radius:4px;">NUOVO PIATTO (in attesa di salvataggio)</div>');
            $dish.prepend($banner);
            
            // Remove any existing controls
            $dish.find('.efe-section-controls').remove();
            
            return $dish;
        },

        /**
         * Create a basic dish structure when no template is available
         */
        createBasicDishStructure: function(categoryId, operationId) {
            // Create a basic Elementor section structure
            const $dish = $('<div class="elementor-section elementor-top-section efe-editable-section efe-pending-duplication"></div>');
            
            // Set data attributes
            $dish.attr('data-section-id', 'new-dish-' + operationId);
            $dish.attr('data-post-id', $('body').data('post-id'));
            $dish.attr('data-operation-id', operationId);
            $dish.attr('data-parent-category', categoryId);
            
            // Add visual styles
            $dish.css({
                'outline': '2px dashed #4CAF50',
                'position': 'relative',
                'margin-top': '10px',
                'margin-bottom': '10px',
                'padding': '15px',
                'opacity': '0.8'
            });
            
            // Add an indicator banner
            const $banner = $('<div class="efe-new-dish-banner" style="background:#4CAF50; color:white; padding:8px; text-align:center; margin-bottom:10px; font-weight:bold; border-radius:4px;">NUOVO PIATTO (in attesa di salvataggio)</div>');
            $dish.append($banner);
            
            // Create a column
            const $column = $('<div class="elementor-column elementor-col-100 elementor-top-column"></div>');
            $dish.append($column);
            
            // Create sample widgets
            const $heading = $('<div class="elementor-widget efe-editable-widget" data-widget-type="heading"></div>');
            $heading.append('<h3>Scrivi il titolo qui...</h3>');
            $column.append($heading);
            
            const $textEditor = $('<div class="elementor-widget efe-editable-widget" data-widget-type="text-editor"></div>');
            $textEditor.append('<div class="elementor-text-editor"><p>Scrivi il testo qui...</p></div>');
            $column.append($textEditor);
            
            const $priceHeading = $('<div class="elementor-widget efe-editable-widget" data-widget-type="price-heading"></div>');
            $priceHeading.append('<h4>0€</h4>');
            $column.append($priceHeading);
            
            // Add blank image
            const $image = $('<div class="elementor-widget efe-editable-widget" data-widget-type="image"></div>');
            $image.append('<img src="/wp-content/plugins/elementor/assets/images/placeholder.png" alt="Placeholder" style="max-width: 100%; height: auto;">');
            $column.append($image);
            
            return $dish;
        }
    };
})(jQuery);