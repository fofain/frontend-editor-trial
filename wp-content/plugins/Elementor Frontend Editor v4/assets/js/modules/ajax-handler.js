/**
 * AJAX Handler Module for Elementor Menu Frontend Editor
 * Handles all AJAX requests to the server
 */
var EFE = EFE || {};

EFE.AjaxHandler = (function($) {
    'use strict';
    
    // Private methods
    
    /**
     * Handle AJAX errors
     */
    function handleAjaxError(xhr, status, error) {
        console.error('AJAX Error:', {xhr: xhr, status: status, error: error});
        EFE.Utils.showNotification(efe_data.strings.error, 'error');
    }
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
    
        },
        
        /**
         * Save widget changes (legacy method - now uses batch save)
         */
        saveWidget: function(widgetType, data, callback) {
            // Add required data
            const requestData = Object.assign({
                action: 'save_elementor_content',
                nonce: efe_data.nonce
            }, data);
            
            // Send AJAX request
            $.post(efe_data.ajax_url, requestData, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Delete a section (legacy method - now uses batch save)
         */
        deleteSection: function(sectionId, postId, callback) {
            // Prepare data
            const data = {
                action: 'delete_elementor_section',
                nonce: efe_data.nonce,
                post_id: postId,
                section_id: sectionId
            };
            
            // Send AJAX request
            $.post(efe_data.ajax_url, data, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Duplicate a section (legacy method - now uses batch save)
         */
        duplicateSection: function(sectionId, postId, callback) {
            // Prepare data
            const data = {
                action: 'duplicate_elementor_section',
                nonce: efe_data.nonce,
                post_id: postId,
                section_id: sectionId
            };
            
            // Send AJAX request
            $.post(efe_data.ajax_url, data, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Move a section (legacy method - now uses batch save)
         */
        moveSection: function(sectionId, postId, direction, callback) {
            // Prepare data
            const data = {
                action: 'move_elementor_section',
                nonce: efe_data.nonce,
                post_id: postId,
                section_id: sectionId,
                direction: direction
            };
            
            // Send AJAX request
            $.post(efe_data.ajax_url, data, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Save dish attributes (legacy method - now uses batch save)
         */
        saveDishAttributes: function(sectionId, postId, attributes, callback) {
            // Prepare data
            const data = Object.assign({
                action: 'save_dish_attributes',
                nonce: efe_data.nonce,
                post_id: postId,
                section_id: sectionId
            }, attributes);
            
            // Send AJAX request
            $.post(efe_data.ajax_url, data, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Generic AJAX request
         */
        sendRequest: function(action, data, callback) {
            // Add required data
            const requestData = Object.assign({
                action: action,
                nonce: efe_data.nonce
            }, data);
            
            // Send AJAX request
            $.post(efe_data.ajax_url, requestData, function(response) {

                
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Save allergen attributes (legacy method - now uses batch save)
         */
        saveAllergenAttributes: function(sectionId, postId, attributes, callback) {
            // Prepare data
            const data = Object.assign({
                action: 'save_allergen_attributes',
                nonce: efe_data.nonce,
                post_id: postId,
                section_id: sectionId
            }, attributes);

            // Send AJAX request
            $.post(efe_data.ajax_url, data, function(response) {


                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(handleAjaxError);
        },
        
        /**
         * Batch save all changes
         * New method for saving all changes at once
         */
        batchSaveChanges: function(changesStore, callback) {
            // First, scan for any widgets in duplicated sections
            const widgetsInDuplicatedSections = {};
            const duplicatedSections = {};
        
            // Find all duplicated sections from the page DOM
            $('.efe-pending-duplication').each(function() {
                const $section = $(this);
                const duplicatedSectionId = $section.data('section-id');
                const originalSectionId = $section.data('original-section-id');
        
                if (duplicatedSectionId && originalSectionId) {
                    duplicatedSections[duplicatedSectionId] = {
                        originalSectionId: originalSectionId,
                        widgets: []
                    };
        
                    // Find all widgets in this duplicated section
                    $section.find('.efe-editable-widget').each(function(index) {
                        const $widget = $(this);
                        const widgetId = $widget.data('widget-id');
                        const originalWidgetId = $widget.data('original-widget-id');
                        const widgetType = $widget.data('widget-type');
        
                        if (widgetId && originalWidgetId) {
                            // Store widget data including index for position reference
                            const widgetData = {
                                widgetId: widgetId,
                                originalWidgetId: originalWidgetId,
                                widgetType: widgetType,
                                index: index
                            };
                            
                            // For price-heading widgets, grab the settings stored in data-attribute
                            if (widgetType === 'price-heading') {
                                const priceSettings = $widget.attr('data-price-settings');
                                if (priceSettings) {
                                    try {
                                        widgetData.priceSettings = JSON.parse(priceSettings);
                                    } catch (e) {
                                        console.error('Error parsing price settings:', e);
                                    }
                                }
                                
                                // Also grab the heading text directly from the DOM as a fallback
                                const headingText = $widget.find('h1, h2, h3, h4, h5, h6').text().trim();
                                widgetData.headingText = headingText;
                            }
                            
                            duplicatedSections[duplicatedSectionId].widgets.push(widgetData);
        
                            // Record which duplicated section this widget belongs to
                            widgetsInDuplicatedSections[widgetId] = {
                                duplicatedSectionId: duplicatedSectionId,
                                originalWidgetId: originalWidgetId,
                                widgetType: widgetType,
                                index: index
                            };
                            
                            // For price headings, add extra data
                            if (widgetType === 'price-heading' && widgetData.priceSettings) {
                                widgetsInDuplicatedSections[widgetId].priceSettings = widgetData.priceSettings;
                            }
                        }
                    });
                }
            });
        
            // Now attach this information to the changes store
            changesStore.duplicatedSections = duplicatedSections;
            changesStore.widgetsInDuplicatedSections = widgetsInDuplicatedSections;
        
            // For each widget change, enhance with duplicate section info
            for (const widgetId in changesStore.widgets) {
                if (widgetsInDuplicatedSections[widgetId]) {
                    // Add basic duplication metadata
                    changesStore.widgets[widgetId].isInDuplicate = true;
                    changesStore.widgets[widgetId].duplicatedSectionId = widgetsInDuplicatedSections[widgetId].duplicatedSectionId;
                    changesStore.widgets[widgetId].originalWidgetId = widgetsInDuplicatedSections[widgetId].originalWidgetId;
                    changesStore.widgets[widgetId].index = widgetsInDuplicatedSections[widgetId].index;
                    changesStore.widgets[widgetId].operationId = widgetsInDuplicatedSections[widgetId].operationId;
                    
                    // For price headings, ensure price settings are included
                    if (widgetsInDuplicatedSections[widgetId].widgetType === 'price-heading' && 
                        widgetsInDuplicatedSections[widgetId].priceSettings) {
                        
                        // If price settings don't already exist in the change, add them
                        if (!changesStore.widgets[widgetId].price_value) {
                            const settings = widgetsInDuplicatedSections[widgetId].priceSettings;
                            changesStore.widgets[widgetId].price_value = settings.price_value;
                            changesStore.widgets[widgetId].currency = settings.currency;
                            changesStore.widgets[widgetId].currency_position = settings.currency_position;
                            changesStore.widgets[widgetId].show_currency = settings.show_currency;
                        }
                    }
                }
            }
            
            // Helper function to get current widget content
            const getCurrentWidgetContent = function($widget, widgetType) {
                switch (widgetType) {
                    case 'heading':
                        const title = $widget.find('h1, h2, h3, h4, h5, h6').text().trim();
                        return { title: title };
                        
                    case 'text-editor':
                        const content = $widget.find('.elementor-text-editor').html() || $widget.find('p').html() || '';
                        return { content: content };
                        
                    case 'price-heading':
                        const priceText = $widget.find('h1, h2, h3, h4, h5, h6').text().trim();
                        const priceValue = priceText.replace(/[€$£¥₽₣Fr.\s]/g, '').trim();
                        return { 
                            price_value: priceValue,
                            currency: '€',
                            currency_position: 'after',
                            show_currency: true
                        };
                        
                                    case 'image':
                    const $img = $widget.find('img');
                    if ($img.length) {
                        const imgSrc = $img.attr('src');
                        const imgAlt = $img.attr('alt') || '';
                        // Try to extract image ID from class
                        let imgId = '';
                        if ($img.attr('class') && $img.attr('class').match(/wp-image-(\d+)/)) {
                            imgId = $img.attr('class').match(/wp-image-(\d+)/)[1];
                        } else if (imgSrc && imgSrc.includes('placeholder.png')) {
                            // This is a placeholder image - keep it as empty ID
                            imgId = '';
                        }
                        return { imageId: imgId, imageUrl: imgSrc, imageAlt: imgAlt };
                    }
                    return null;
                        
                    case 'price-table':
                    case 'price-list':
                        const price = $widget.find('[class*="price"]').text().trim().replace(/[^0-9.,]/g, '');
                        return { price: price };
                        
                    default:
                        return null;
                }
            };
            
            // Also handle widgets in new blank dishes
            $('.efe-pending-duplication[data-operation-id]').each(function() {
                const $section = $(this);
                const operationId = $section.data('operation-id');
                const isNewDish = $section.attr('data-section-id') && $section.attr('data-section-id').startsWith('new-dish-');
                
                if (isNewDish) {
                    // Find all widgets in this new dish
                    $section.find('.efe-editable-widget').each(function(index) {
                        const $widget = $(this);
                        const widgetId = $widget.data('widget-id');
                        const widgetType = $widget.data('widget-type');
                        
                        if (widgetId && widgetType) {
                            // Always add new dish widgets to changes store
                            console.log('EFE: Processing new dish widget:', widgetId, widgetType);
                            const currentContent = getCurrentWidgetContent($widget, widgetType);
                            console.log('EFE: Current content for widget:', widgetId, currentContent);
                            if (currentContent) {
                                changesStore.widgets[widgetId] = {
                                    widgetId: widgetId,
                                    postId: $('body').data('post-id') || document.body.dataset.postId,
                                    widgetType: widgetType,
                                    ...currentContent,
                                    isInDuplicate: true,
                                    isNewDish: true,
                                    operationId: operationId,
                                    index: index,
                                    duplicatedSectionId: $section.data('section-id')
                                };
                            }
                            
                            // Also update existing changes if they exist
                            if (changesStore.widgets[widgetId]) {
                                changesStore.widgets[widgetId].isInDuplicate = true;
                                changesStore.widgets[widgetId].isNewDish = true;
                                changesStore.widgets[widgetId].operationId = operationId;
                                changesStore.widgets[widgetId].index = index;
                                changesStore.widgets[widgetId].duplicatedSectionId = $section.data('section-id');
                            }
                        }
                    });
                }
            });
            
            // Create special handling for price-heading widgets in duplicate sections
            // Check if any price-heading widgets need to be added to changes
            for (const widgetId in widgetsInDuplicatedSections) {
                // If this is a price-heading widget but not in the changes yet
                if (widgetsInDuplicatedSections[widgetId].widgetType === 'price-heading' && 
                    widgetsInDuplicatedSections[widgetId].priceSettings &&
                    !changesStore.widgets[widgetId]) {
                    
                    // Add a new change for this price-heading widget
                    const settings = widgetsInDuplicatedSections[widgetId].priceSettings;
                    changesStore.widgets[widgetId] = {
                        widgetId: widgetId,
                        postId: $('body').data('post-id') || document.body.dataset.postId,
                        widgetType: 'price-heading',
                        price_value: settings.price_value,
                        currency: settings.currency,
                        currency_position: settings.currency_position,
                        show_currency: settings.show_currency,
                        isInDuplicate: true,
                        duplicatedSectionId: widgetsInDuplicatedSections[widgetId].duplicatedSectionId,
                        originalWidgetId: widgetsInDuplicatedSections[widgetId].originalWidgetId,
                        index: widgetsInDuplicatedSections[widgetId].index
                    };
                    
    
                }
            }
        
            // Prepare data for AJAX
            console.log('EFE: Preparing AJAX data with changes:', changesStore);
            const data = {
                action: 'batch_save_elementor_content',
                nonce: efe_data.nonce,
                changes: JSON.stringify(changesStore)
            };
        
            // Send AJAX request
            console.log('EFE: Sending AJAX request...');
            $.post(efe_data.ajax_url, data, function(response) {
                console.log('EFE: AJAX response received:', response);
        
                if (typeof callback === 'function') {
                    callback(response);
                }
            }).fail(function(xhr, status, error) {
                console.error('EFE: AJAX request failed:', status, error);
                console.error('EFE: Response text:', xhr.responseText);
                handleAjaxError(xhr, status, error);
            });
        },
        

    };
})(jQuery);