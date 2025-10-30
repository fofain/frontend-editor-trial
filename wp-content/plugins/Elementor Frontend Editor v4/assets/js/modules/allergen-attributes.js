/**
 * Allergen Attributes Module for Elementor Menu Frontend Editor
 */
var EFE = EFE || {};

EFE.AllergenAttributes = (function($) {
    'use strict';
    
    return {
        init: function() {
    
        },
        
        openEditor: function($section) {
            const sectionId = $section.data('section-id');
            const postId = $section.data('post-id');
            
            if (!sectionId || !postId) {
                console.error('Missing section or post ID:', $section);
                EFE.Utils.showNotification('Impossibile identificare la sezione', 'error');
                return;
            }
            

            
            $('#efe-allergen-section-id').val(sectionId);
            $('#efe-allergen-post-id').val(postId);
            
            $('#efe-allergen-gluten').prop('checked', false);
            $('#efe-allergen-crustaceans').prop('checked', false);
            $('#efe-allergen-eggs').prop('checked', false);
            $('#efe-allergen-fish').prop('checked', false);
            $('#efe-allergen-peanuts').prop('checked', false);
            $('#efe-allergen-soy').prop('checked', false);
            $('#efe-allergen-milk').prop('checked', false);
            $('#efe-allergen-nuts').prop('checked', false);
            $('#efe-allergen-celery').prop('checked', false);
            $('#efe-allergen-mustard').prop('checked', false);
            $('#efe-allergen-sesame').prop('checked', false);
            $('#efe-allergen-sulphites').prop('checked', false);
            $('#efe-allergen-lupin').prop('checked', false);
            $('#efe-allergen-molluscs').prop('checked', false);
            
            EFE.Utils.showNotification('Caricamento allergeni...', 'info');
            this.checkIconsVisibility($section);
            $('#efe-allergen-attributes-editor').show();
        },
        
        checkIconsVisibility: function($section) {
            const $glutenIcon = $section.find('[id*="allergen-gluten"], [class*="allergen-gluten"]');
            const $crustaceansIcon = $section.find('[id*="allergen-crustaceans"], [class*="allergen-crustaceans"]');
            const $eggsIcon = $section.find('[id*="allergen-eggs"], [class*="allergen-eggs"]');
            const $fishIcon = $section.find('[id*="allergen-fish"], [class*="allergen-fish"]');
            const $peanutsIcon = $section.find('[id*="allergen-peanuts"], [class*="allergen-peanuts"]');
            const $soyIcon = $section.find('[id*="allergen-soy"], [class*="allergen-soy"]');
            const $milkIcon = $section.find('[id*="allergen-milk"], [class*="allergen-milk"]');
            const $nutsIcon = $section.find('[id*="allergen-nuts"], [class*="allergen-nuts"]');
            const $celeryIcon = $section.find('[id*="allergen-celery"], [class*="allergen-celery"]');
            const $mustardIcon = $section.find('[id*="allergen-mustard"], [class*="allergen-mustard"]');
            const $sesameIcon = $section.find('[id*="allergen-sesame"], [class*="allergen-sesame"]');
            const $sulphitesIcon = $section.find('[id*="allergen-sulphites"], [class*="allergen-sulphites"]');
            const $lupinIcon = $section.find('[id*="allergen-lupin"], [class*="allergen-lupin"]');
            const $molluscsIcon = $section.find('[id*="allergen-molluscs"], [class*="allergen-molluscs"]');
            
            $('#efe-allergen-gluten').prop('checked', $glutenIcon.length > 0 && !$glutenIcon.hasClass('efe-hidden-icon') && $glutenIcon.css('display') !== 'none');
            $('#efe-allergen-crustaceans').prop('checked', $crustaceansIcon.length > 0 && !$crustaceansIcon.hasClass('efe-hidden-icon') && $crustaceansIcon.css('display') !== 'none');
            $('#efe-allergen-eggs').prop('checked', $eggsIcon.length > 0 && !$eggsIcon.hasClass('efe-hidden-icon') && $eggsIcon.css('display') !== 'none');
            $('#efe-allergen-fish').prop('checked', $fishIcon.length > 0 && !$fishIcon.hasClass('efe-hidden-icon') && $fishIcon.css('display') !== 'none');
            $('#efe-allergen-peanuts').prop('checked', $peanutsIcon.length > 0 && !$peanutsIcon.hasClass('efe-hidden-icon') && $peanutsIcon.css('display') !== 'none');
            $('#efe-allergen-soy').prop('checked', $soyIcon.length > 0 && !$soyIcon.hasClass('efe-hidden-icon') && $soyIcon.css('display') !== 'none');
            $('#efe-allergen-milk').prop('checked', $milkIcon.length > 0 && !$milkIcon.hasClass('efe-hidden-icon') && $milkIcon.css('display') !== 'none');
            $('#efe-allergen-nuts').prop('checked', $nutsIcon.length > 0 && !$nutsIcon.hasClass('efe-hidden-icon') && $nutsIcon.css('display') !== 'none');
            $('#efe-allergen-celery').prop('checked', $celeryIcon.length > 0 && !$celeryIcon.hasClass('efe-hidden-icon') && $celeryIcon.css('display') !== 'none');
            $('#efe-allergen-mustard').prop('checked', $mustardIcon.length > 0 && !$mustardIcon.hasClass('efe-hidden-icon') && $mustardIcon.css('display') !== 'none');
            $('#efe-allergen-sesame').prop('checked', $sesameIcon.length > 0 && !$sesameIcon.hasClass('efe-hidden-icon') && $sesameIcon.css('display') !== 'none');
            $('#efe-allergen-sulphites').prop('checked', $sulphitesIcon.length > 0 && !$sulphitesIcon.hasClass('efe-hidden-icon') && $sulphitesIcon.css('display') !== 'none');
            $('#efe-allergen-lupin').prop('checked', $lupinIcon.length > 0 && !$lupinIcon.hasClass('efe-hidden-icon') && $lupinIcon.css('display') !== 'none');
            $('#efe-allergen-molluscs').prop('checked', $molluscsIcon.length > 0 && !$molluscsIcon.hasClass('efe-hidden-icon') && $molluscsIcon.css('display') !== 'none');
        },
        
        saveAttributes: function(e) {
            e.preventDefault();
            e.stopPropagation();
        
            const sectionId = $('#efe-allergen-section-id').val();
            const postId = $('#efe-allergen-post-id').val();
        
            const gluten = $('#efe-allergen-gluten').prop('checked');
            const crustaceans = $('#efe-allergen-crustaceans').prop('checked');
            const eggs = $('#efe-allergen-eggs').prop('checked');
            const fish = $('#efe-allergen-fish').prop('checked');
            const peanuts = $('#efe-allergen-peanuts').prop('checked');
            const soy = $('#efe-allergen-soy').prop('checked');
            const milk = $('#efe-allergen-milk').prop('checked');
            const nuts = $('#efe-allergen-nuts').prop('checked');
            const celery = $('#efe-allergen-celery').prop('checked');
            const mustard = $('#efe-allergen-mustard').prop('checked');
            const sesame = $('#efe-allergen-sesame').prop('checked');
            const sulphites = $('#efe-allergen-sulphites').prop('checked');
            const lupin = $('#efe-allergen-lupin').prop('checked');
            const molluscs = $('#efe-allergen-molluscs').prop('checked');
        
            const $section = $('[data-section-id="' + sectionId + '"]');
            if ($section.length) {
                this.updateIconsVisibility(sectionId, {
                    gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, 
                    celery, mustard, sesame, sulphites, lupin, molluscs
                });
        
                // Store the allergen values as a JSON array for easier handling
                const allergensList = [];
                if (gluten) allergensList.push('gluten');
                if (crustaceans) allergensList.push('crustaceans');
                if (eggs) allergensList.push('eggs');
                if (fish) allergensList.push('fish');
                if (peanuts) allergensList.push('peanuts');
                if (soy) allergensList.push('soy');
                if (milk) allergensList.push('milk');
                if (nuts) allergensList.push('nuts');
                if (celery) allergensList.push('celery');
                if (mustard) allergensList.push('mustard');
                if (sesame) allergensList.push('sesame');
                if (sulphites) allergensList.push('sulphites');
                if (lupin) allergensList.push('lupin');
                if (molluscs) allergensList.push('molluscs');
                
                // Store as JSON string
                $section.attr('data-allergens', JSON.stringify(allergensList));
        
                // DO NOT change the section-id attribute!
                $section.attr('data-allergen-gluten', gluten ? 'true' : 'false');
                $section.attr('data-allergen-crustaceans', crustaceans ? 'true' : 'false');
                $section.attr('data-allergen-eggs', eggs ? 'true' : 'false');
                $section.attr('data-allergen-fish', fish ? 'true' : 'false');
                $section.attr('data-allergen-peanuts', peanuts ? 'true' : 'false');
                $section.attr('data-allergen-soy', soy ? 'true' : 'false');
                $section.attr('data-allergen-milk', milk ? 'true' : 'false');
                $section.attr('data-allergen-nuts', nuts ? 'true' : 'false');
                $section.attr('data-allergen-celery', celery ? 'true' : 'false');
                $section.attr('data-allergen-mustard', mustard ? 'true' : 'false');
                $section.attr('data-allergen-sesame', sesame ? 'true' : 'false');
                $section.attr('data-allergen-sulphites', sulphites ? 'true' : 'false');
                $section.attr('data-allergen-lupin', lupin ? 'true' : 'false');
                $section.attr('data-allergen-molluscs', molluscs ? 'true' : 'false');
            }
        
            // Store the change for server-side saving
            EFE.EditorManager.addChange('attribute', {
                type: 'allergen',
                sectionId: sectionId,
                postId: postId,
                attributes: {
                    gluten: gluten ? 1 : 0,
                    crustaceans: crustaceans ? 1 : 0,
                    eggs: eggs ? 1 : 0,
                    fish: fish ? 1 : 0,
                    peanuts: peanuts ? 1 : 0,
                    soy: soy ? 1 : 0,
                    milk: milk ? 1 : 0,
                    nuts: nuts ? 1 : 0,
                    celery: celery ? 1 : 0,
                    mustard: mustard ? 1 : 0,
                    sesame: sesame ? 1 : 0,
                    sulphites: sulphites ? 1 : 0,
                    lupin: lupin ? 1 : 0,
                    molluscs: molluscs ? 1 : 0
                }
            });
        
            // First ensure form is reset to prevent browser from saving values
            document.getElementById('efe-allergen-attributes-form').reset();
            
            // MODIFIED APPROACH: Use ModalHandler to ensure proper closure
            if (EFE.ModalHandler && EFE.ModalHandler.closeModals) {
                EFE.ModalHandler.closeModals();
            } else {
                // Fallback direct hide
                $('#efe-allergen-attributes-editor').hide();
                $('.efe-editor-modal').hide();
            }
        
            // Show success notification
            EFE.Utils.showNotification('Allergeni aggiornati', 'success');
        },
        
        updateIconsVisibility: function(sectionId, attributes) {
            const $section = $('.efe-editable-section[data-section-id="' + sectionId + '"]');
        
            if ($section.length === 0) {
                console.warn('Section not found in DOM:', sectionId);
                return;
            }
        
            // Get all possible allergens
            const allergens = [
                'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
                'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
            ];
        
            // Get all selector prefixes to try
            const selectorPrefixes = [
                // Direct class/ID matches
                '[id*="allergen-', '[class*="allergen-',
                // Full path matches
                ' [id*="allergen-', ' [class*="allergen-',
                // Element type matches
                ' i[class*="allergen-', ' span[class*="allergen-', ' div[class*="allergen-',
                // Elementor-specific matches
                ' .elementor-icon [class*="allergen-', ' .elementor-icon-wrapper [class*="allergen-',
                // Alternative naming formats (without "allergen-" prefix)
                '[id*="', '[class*="',
                ' [id*="', ' [class*="',
                ' i[class*="', ' span[class*="', ' div[class*="'
            ];
            
                // Process each allergen with multiple selector attempts
                allergens.forEach(allergen => {
                    if (!(allergen in attributes)) return;
                    
                    // Build a comprehensive selector that tries ALL possible variations
                    let selectors = [];
                    
                    // Generate all possible selector combinations
                    selectorPrefixes.forEach(prefix => {
                        // Always prioritize the allergen- prefix for specificity
                        selectors.push(prefix + 'allergen-' + allergen + '"]');
                        selectors.push(prefix.replace('-', '_') + 'allergen_' + allergen + '"]');
                        
                        // For gluten specifically, ensure we don't match dish attribute icons
                        if (allergen === 'gluten') {
                            // Exclude gluten-free variants (dish attribute)
                            if (!prefix.includes('gluten-free') && !prefix.includes('glutenfree')) {
                                selectors.push(prefix + 'allergen-' + allergen + '"]');
                            }
                        } else {
                            // For non-gluten allergens, also try the plain version
                            selectors.push(prefix + allergen + '"]');
                        }
                    });
                
                // Join all selectors with commas for one massive OR query
                const megaSelector = selectors.join(', ');
                
                // Try to find ANY matching icon
                const $icons = $section.find(megaSelector);
                

                
                if ($icons.length > 0) {
                    if (attributes[allergen]) {
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
        
        refreshIconsVisibility: function($section) {
            const sectionId = $section.data('section-id');
            if (!sectionId) return;
            
            const allergens = [
                'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
                'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
            ];
            
            // First check if we have data attributes stored on the element
            const hasStoredAttrs = $section.attr('data-allergen-gluten') !== undefined;
            
            if (hasStoredAttrs) {
                // Use the stored attributes for visibility
                const visibilityState = {};
                
                allergens.forEach(allergen => {
                    visibilityState[allergen] = $section.attr('data-allergen-' + allergen) === 'true';
                });
                
                // Update visibility based on stored attributes
                this.updateIconsVisibility(sectionId, visibilityState);
                return;
            }
            
            // Fallback to checking icon visibility in the DOM
            const visibilityState = {};
            
            // Check current visibility for each allergen
            allergens.forEach(allergen => {
                const $icon = $section.find(`[id*="allergen-${allergen}"], [class*="allergen-${allergen}"]`);
                visibilityState[allergen] = $icon.length > 0 && !$icon.is(':hidden');
            });
            
            // Update icons visibility
            this.updateIconsVisibility(sectionId, visibilityState);
        }
    };
})(jQuery);