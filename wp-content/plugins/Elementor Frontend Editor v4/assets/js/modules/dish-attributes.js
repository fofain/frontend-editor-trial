/**
 * Dish Attributes Module for Elementor Menu Frontend Editor
 * Handles dish attributes like vegetarian, chef's special, etc.
 */
var EFE = EFE || {};

EFE.DishAttributes = (function($) {
    'use strict';
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
    
        },
        
        /**
         * Open dish attributes editor
         */
        openEditor: function($section) {
            const sectionId = $section.data('section-id');
            const postId = $section.data('post-id');
            
            if (!sectionId || !postId) {
                console.error('Missing section or post ID:', $section);
                EFE.Utils.showNotification('Impossibile identificare la sezione', 'error');
                return;
            }
            

            
            // Populate form with current values
            $('#efe-dish-section-id').val(sectionId);
            $('#efe-dish-post-id').val(postId);
            
            // Reset checkboxes
            $('#efe-dish-vegetarian').prop('checked', false);
            $('#efe-dish-chef-special').prop('checked', false);
            $('#efe-dish-gluten-free').prop('checked', false);
            $('#efe-dish-spicy').prop('checked', false);
            
            // Show loading notification
            EFE.Utils.showNotification('Caricamento attributi...', 'info');
            
            // For simplicity, directly check icons visibility in the section
            this.checkIconsVisibility($section);
            
            // Show modal
            $('#efe-dish-attributes-editor').show();
        },
        
        /**
         * Check current visibility of icons and set checkboxes accordingly
         */
        checkIconsVisibility: function($section) {
            // Look for icons within the section
            // Use different strategies to find icons
            
            // Method 1: Look for specific ID or class
            const $vegetarianIcon = $section.find('[id*="vegetarian"], [class*="vegetarian"], [id*="vegetarian-icon"], [data-icon-name*="vegetarian"]');
            const $chefSpecialIcon = $section.find('[id*="chef-special"], [class*="chef-special"], [id*="chef-icon"], [data-icon-name*="chef"]');
            const $glutenFreeIcon = $section.find('[id*="gluten-free"], [class*="gluten-free"], [id*="gluten-icon"], [data-icon-name*="gluten"]');
            const $spicyIcon = $section.find('[id*="spicy"], [class*="spicy"], [id*="spicy-icon"], [data-icon-name*="spicy"]');
            
            // Check if each icon is visible and set corresponding checkbox
            $('#efe-dish-vegetarian').prop('checked', $vegetarianIcon.length > 0 && !$vegetarianIcon.hasClass('efe-hidden-icon') && $vegetarianIcon.css('display') !== 'none');
            $('#efe-dish-chef-special').prop('checked', $chefSpecialIcon.length > 0 && !$chefSpecialIcon.hasClass('efe-hidden-icon') && $chefSpecialIcon.css('display') !== 'none');
            $('#efe-dish-gluten-free').prop('checked', $glutenFreeIcon.length > 0 && !$glutenFreeIcon.hasClass('efe-hidden-icon') && $glutenFreeIcon.css('display') !== 'none');
            $('#efe-dish-spicy').prop('checked', $spicyIcon.length > 0 && !$spicyIcon.hasClass('efe-hidden-icon') && $spicyIcon.css('display') !== 'none');
        },
        
        /**
         * Save dish attributes
         */
        saveAttributes: function(e) {
            e.preventDefault();
            e.stopPropagation();
        
            const $form = $(e.currentTarget);
            const sectionId = $('#efe-dish-section-id').val();
            const postId = $('#efe-dish-post-id').val();
        
            // Get checkbox values
            const vegetarian = $('#efe-dish-vegetarian').prop('checked');
            const chefSpecial = $('#efe-dish-chef-special').prop('checked');
            const glutenFree = $('#efe-dish-gluten-free').prop('checked');
            const spicy = $('#efe-dish-spicy').prop('checked');
        
            // Important: Apply the attribute changes directly to the DOM
            // Find the section element
            const $section = $('[data-section-id="' + sectionId + '"]');
            if ($section.length) {
                // Update icons visibility immediately for visual feedback
                this.updateIconsVisibility(sectionId, {
                    vegetarian: vegetarian,
                    chefSpecial: chefSpecial,
                    glutenFree: glutenFree,
                    spicy: spicy
                });
        
                // Store the visual state directly on the section element for persistence
                // DO NOT change the section-id attribute!
                $section.attr('data-vegetarian', vegetarian ? 'true' : 'false');
                $section.attr('data-chef-special', chefSpecial ? 'true' : 'false');
                $section.attr('data-gluten-free', glutenFree ? 'true' : 'false');
                $section.attr('data-spicy', spicy ? 'true' : 'false');
            }
        
            // Store the change for server-side saving
            EFE.EditorManager.addChange('attribute', {
                type: 'dish',
                sectionId: sectionId,
                postId: postId,
                attributes: {
                    vegetarian: vegetarian ? 1 : 0,
                    chef_special: chefSpecial ? 1 : 0,
                    gluten_free: glutenFree ? 1 : 0,
                    spicy: spicy ? 1 : 0
                }
            });
        
            // MODIFIED APPROACH: First hide modal directly
            $('#efe-dish-attributes-editor').hide();
            
            // Then use the general close function
            if (EFE.ModalHandler && EFE.ModalHandler.closeModals) {
                EFE.ModalHandler.closeModals();
            }
        
            // Show success notification
            EFE.Utils.showNotification('Attributi piatto aggiornati', 'success');
        },
        
        /**
         * Update visibility of icons based on selected attributes
         * This is a temporary solution to see changes immediately,
         * while waiting for page reload
         */
        updateIconsVisibility: function(sectionId, attributes) {
            const $section = $('.efe-editable-section[data-section-id="' + sectionId + '"]');
        
            if ($section.length === 0) {
                console.warn('Section not found in DOM:', sectionId);
                return;
            }
        
            // Get all icon selectors to try
            const selectorPrefixes = [
                // Direct class/ID matches
                '[id*="', '[class*="',
                // Full path matches
                ' [id*="', ' [class*="',
                // Element type matches
                ' i[class*="', ' span[class*="', ' div[class*="',
                // Elementor-specific matches
                ' .elementor-icon [class*="', ' .elementor-icon-wrapper [class*="'
            ];
            
            const selectorSuffixes = [
                'vegetarian', 'chef-special', 'chef_special', 'gluten-free', 'gluten_free', 'spicy'
            ];
            
            // Map JS properties to all possible CSS selectors
            const attrMap = {
                'vegetarian': ['vegetarian', 'vegan'],
                'chefSpecial': ['chef-special', 'chef_special', 'special', 'chef'],
                'glutenFree': ['gluten-free', 'gluten_free', 'gf'],
                'spicy': ['spicy', 'hot', 'piccante']
            };
            
            // Process each attribute with multiple selector attempts
            Object.keys(attrMap).forEach(attr => {
                // Build a comprehensive selector that tries ALL possible variations
                let selectors = [];
                
                // Generate all possible selector combinations
                attrMap[attr].forEach(keyword => {
                    selectorPrefixes.forEach(prefix => {
                        // Add dish-specific selectors to ensure no overlap with allergens
                        selectors.push(prefix + keyword + '"]');
                        selectors.push(prefix + 'dish-' + keyword + '"]');
                        
                        // Specifically avoid "allergen-" prefix items
                        if (attr === 'glutenFree') {
                            selectors.push(prefix + 'gluten-free"]');
                            selectors.push(prefix + 'glutenfree"]');
                            // Exclude allergen variants
                            selectors = selectors.filter(sel => !sel.includes('allergen-'));
                        }
                    });
                });
                
                // Join all selectors with commas for one massive OR query
                const megaSelector = selectors.join(', ');
                
                // Try to find ANY matching icon
                const $icons = $section.find(megaSelector);
                

                
                if ($icons.length > 0) {
                    if (attributes[attr]) {
                        // EXTREME FORCE SHOW
                        $icons.removeClass('efe-hidden-icon elementor-hidden');
                        $icons.css({'display': 'inline-block !important', 'visibility': 'visible !important', 'opacity': '1 !important'});
                        $icons.attr('style', function(i, style) {
                            return (style || '') + '; display: inline-block !important; visibility: visible !important; opacity: 1 !important;';
                        });
                        
                        // Force parent containers to be visible too
                        $icons.parents().each(function() {
                            const $parent = $(this);
                            $parent.css({'display': '', 'visibility': '', 'opacity': ''});
                        });
                        
                        // Forcefully add an !important inline display rule
                        $icons.each(function() {
                            const $icon = $(this);
                            // Use direct DOM API for maximum override power
                            this.style.setProperty('display', 'inline-block', 'important');
                            this.style.setProperty('visibility', 'visible', 'important');
                            this.style.setProperty('opacity', '1', 'important');
                        });
                    } else {
                        // EXTREME FORCE HIDE
                        $icons.addClass('efe-hidden-icon');
                        $icons.css({'display': 'none !important', 'visibility': 'hidden !important'});
                        $icons.attr('style', function(i, style) {
                            return (style || '') + '; display: none !important; visibility: hidden !important;';
                        });
                        
                        // Forcefully add an !important inline display rule
                        $icons.each(function() {
                            // Use direct DOM API for maximum override power
                            this.style.setProperty('display', 'none', 'important');
                            this.style.setProperty('visibility', 'hidden', 'important');
                        });
                    }
                }
            });
        

        },
        
        /**
         * Refresh icons visibility for a section based on stored attributes
         */
        refreshIconsVisibility: function($section) {
            const sectionId = $section.data('section-id');
            if (!sectionId) return;
            
            // First, check for data attributes that were set during editing
            const vegetarianAttr = $section.attr('data-vegetarian');
            const chefSpecialAttr = $section.attr('data-chef-special');
            const glutenFreeAttr = $section.attr('data-gluten-free');
            const spicyAttr = $section.attr('data-spicy');
            
            // If attributes are stored on the element, use those
            if (vegetarianAttr !== undefined && chefSpecialAttr !== undefined && 
                glutenFreeAttr !== undefined && spicyAttr !== undefined) {
                
                this.updateIconsVisibility(sectionId, {
                    vegetarian: vegetarianAttr === 'true',
                    chefSpecial: chefSpecialAttr === 'true',
                    glutenFree: glutenFreeAttr === 'true',
                    spicy: spicyAttr === 'true'
                });
                return;
            }
            
            // Fallback to checking icon visibility in the DOM
            const vegetarianVisible = !($section.find('[id*="vegetarian"], [class*="vegetarian"]').is(':hidden'));
            const chefSpecialVisible = !($section.find('[id*="chef-special"], [class*="chef-special"]').is(':hidden'));
            const glutenFreeVisible = !($section.find('[id*="gluten-free"], [class*="gluten-free"]').is(':hidden'));
            const spicyVisible = !($section.find('[id*="spicy"], [class*="spicy"]').is(':hidden'));
            
            // Update visibility based on what we found
            this.updateIconsVisibility(sectionId, {
                vegetarian: vegetarianVisible,
                chefSpecial: chefSpecialVisible,
                glutenFree: glutenFreeVisible,
                spicy: spicyVisible
            });
        }
    };
})(jQuery);