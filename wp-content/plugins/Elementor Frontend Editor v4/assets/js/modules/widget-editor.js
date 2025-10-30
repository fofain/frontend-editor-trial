/**
 * Widget Editor Module for Elementor Menu Frontend Editor
 * Handles editing operations for different widget types
 */
var EFE = EFE || {};

EFE.WidgetEditor = (function($) {
    'use strict';
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
    
        },
        
        /**
         * Highlight a widget when clicked
         */
        highlightWidget: function($widget) {
            // Remove highlight from all other widgets
            $('.efe-highlight').removeClass('efe-highlight');
            
            // Highlight this widget
            $widget.addClass('efe-highlight');
        },
        
        /**
         * Open appropriate editor for widget type
         */
        openEditor: function($widget) {
            const widgetType = $widget.data('widget-type');
            const widgetId = $widget.data('widget-id');
            const postId = $widget.data('post-id');
            
            // Check if this widget is in a new dish
            const $parentSection = $widget.closest('.efe-pending-duplication');
            const isInNewDish = $parentSection.length > 0 && 
                               $parentSection.attr('data-section-id') && 
                               $parentSection.attr('data-section-id').startsWith('new-dish-');
            
            // Store reference to the current widget being edited
            window.currentEditingWidget = $widget;
            
            // If this is a new dish widget, we need to handle it differently
            if (isInNewDish) {
                this.openEditorForNewDish($widget, widgetType, widgetId, postId);
                return;
            }
            
            switch (widgetType) {
                case 'heading':
                    this.openHeadingEditor($widget, widgetId, postId);
                    break;
                    
                case 'price-heading':
                    this.openPriceHeadingEditor($widget, widgetId, postId);
                    break;
                    
                case 'text-editor':
                    this.openTextEditor($widget, widgetId, postId);
                    break;
                    
                case 'image':
                    this.openImageEditor($widget, widgetId, postId);
                    break;
                    
                case 'price-table':
                case 'price-list':
                    this.openPriceEditor($widget, widgetId, postId);
                    break;
                    
                default:
                    console.warn('Unsupported widget type:', widgetType);
                    EFE.Utils.showNotification('Questo tipo di widget non è modificabile in questa versione.', 'warning');
                    break;
            }
        },
        
        /**
         * Open editor for widgets in new dishes
         */
        openEditorForNewDish: function($widget, widgetType, widgetId, postId) {
            // Get the parent section info
            const $parentSection = $widget.closest('.efe-pending-duplication');
            const operationId = $parentSection.data('operation-id');
            const sectionId = $parentSection.data('section-id');
            
            // Find the widget index within the section
            const widgetIndex = $parentSection.find('.efe-editable-widget').index($widget);
            
            // Store additional metadata for new dish widgets
            window.currentEditingWidget.data('operation-id', operationId);
            window.currentEditingWidget.data('section-id', sectionId);
            window.currentEditingWidget.data('widget-index', widgetIndex);
            window.currentEditingWidget.data('is-new-dish', true);
            
            // Open the appropriate editor based on widget type
            switch (widgetType) {
                case 'heading':
                    this.openHeadingEditor($widget, widgetId, postId);
                    break;
                    
                case 'price-heading':
                    this.openPriceHeadingEditor($widget, widgetId, postId);
                    break;
                    
                case 'text-editor':
                    this.openTextEditor($widget, widgetId, postId);
                    break;
                    
                case 'image':
                    this.openImageEditor($widget, widgetId, postId);
                    break;
                    
                case 'price-table':
                case 'price-list':
                    this.openPriceEditor($widget, widgetId, postId);
                    break;
                    
                default:
                    console.warn('Unsupported widget type for new dish:', widgetType);
                    EFE.Utils.showNotification('Questo tipo di widget non è modificabile in questa versione.', 'warning');
                    break;
            }
        },
        
        /**
         * Open heading editor
         */
        openHeadingEditor: function($widget, widgetId, postId) {
            // Get current heading text
            const headingText = $widget.find('h1, h2, h3, h4, h5, h6').text().trim();
            

            
            // Populate form
            $('#efe-heading-widget-id').val(widgetId);
            $('#efe-heading-post-id').val(postId);
            $('#efe-heading-title').val(headingText);
            
            // Show modal
            $('#efe-heading-editor').show();
        },
        
        /**
         * Open text editor
         */
        openTextEditor: function($widget, widgetId, postId) {
            // Get HTML content of the editor
            let textContent = '';
            let htmlContent = '';
            
            // Attempt 1: Look for standard container
            if ($widget.find('.elementor-text-editor').length) {
                htmlContent = $widget.find('.elementor-text-editor').html();
            }
            // Attempt 2: Look for any element with class containing "text-editor"
            else if ($widget.find('[class*="text-editor"]').length) {
                htmlContent = $widget.find('[class*="text-editor"]').html();
            }
            // Attempt 3: Look inside widget without specifying classes
            else {
                htmlContent = $widget.html();
                // Remove any wrappers
                htmlContent = htmlContent.replace(/<div[^>]*>|<\/div>/g, '');
            }
            
            // Trim any whitespace after getting the HTML content
            htmlContent = htmlContent.trim();
            
            // Convert HTML to plain text for display
            // Force cleanup of empty spaces
            htmlContent = htmlContent.replace(/>\s+</g, '><');
            textContent = EFE.Utils.stripHtmlForDisplay(htmlContent);
            

            
            // Populate form
            $('#efe-text-widget-id').val(widgetId);
            $('#efe-text-post-id').val(postId);
            $('#efe-text-content').val(textContent);
            
            // Save original HTML content in a hidden field to preserve it
            if (!$('#efe-original-html').length) {
                $('<input type="hidden" id="efe-original-html" name="original_html">').appendTo('#efe-text-form');
            }
            $('#efe-original-html').val(htmlContent);
            
            // Show modal
            $('#efe-text-editor').show();
        },
        
        /**
         * Open image editor
         */
        openImageEditor: function($widget, widgetId, postId) {
            // Get current image URL and attributes
            const $img = $widget.find('img');
            
            // For new dishes, if no image exists, create a placeholder
            if (!$img.length) {
                // Check if this is a new dish widget
                const isNewDish = $widget.data('is-new-dish') === true;
                
                if (isNewDish) {
                    // Create a placeholder image for new dishes
                    const placeholderImg = $('<img src="/wp-content/plugins/elementor/assets/images/placeholder.png" alt="Placeholder" style="max-width: 100%; height: auto;">');
                    $widget.append(placeholderImg);
                } else {
                    console.warn('Image not found in widget');
                    EFE.Utils.showNotification('Immagine non trovata nel widget', 'error');
                    return;
                }
            }
            
            const imgSrc = $img.attr('src') || '';
            const imgTitle = $img.attr('title') || '';
            const imgAlt = $img.attr('alt') || '';
            
            // Try to get image ID
            let imgId = '';
            
            // Method 1: From a data attribute
            if ($widget.find('[data-image-id]').length) {
                imgId = $widget.find('[data-image-id]').data('image-id');
            }
            // Method 2: From a class with format wp-image-ID
            else if ($img.attr('class') && $img.attr('class').match(/wp-image-(\d+)/)) {
                imgId = $img.attr('class').match(/wp-image-(\d+)/)[1];
            }
            

            
            // Populate form
            $('#efe-image-widget-id').val(widgetId);
            $('#efe-image-post-id').val(postId);
            $('#efe-image-id').val(imgId);
            
            // Update image preview
            if (imgSrc) {
                $('#efe-image-preview').html('<img src="' + imgSrc + '" alt="" style="max-width:100%;">');
            } else {
                $('#efe-image-preview').html('<div class="efe-no-image">Nessuna immagine selezionata</div>');
            }
            
            // Show modal
            $('#efe-image-editor').show();
        },
        
        /**
         * Open price editor
         */
        openPriceEditor: function($widget, widgetId, postId) {
            // Get current price
            let priceValue = '';
            
            // Various attempts to find price based on widget structure
            if ($widget.find('.elementor-price-table__price').length) {
                priceValue = $widget.find('.elementor-price-table__price').text().trim();
            } else if ($widget.find('.elementor-price-list__price').length) {
                priceValue = $widget.find('.elementor-price-list__price').text().trim();
            } else if ($widget.find('[class*="price"]').length) {
                priceValue = $widget.find('[class*="price"]').first().text().trim();
            }
            
            // Remove any currency symbols and formatting
            priceValue = priceValue.replace(/[^0-9.,]/g, '');
            

            
            // Populate form
            $('#efe-price-widget-id').val(widgetId);
            $('#efe-price-post-id').val(postId);
            $('#efe-price-value').val(priceValue);
            
            // Show modal
            $('#efe-price-editor').show();
        },
        
        /**
         * Open price heading editor (simplified - only price value)
         */
        openPriceHeadingEditor: function($widget, widgetId, postId) {
            // Get current heading text and extract price value
            const headingText = $widget.find('h1, h2, h3, h4, h5, h6').text().trim();
            
            let priceValue = '';
            
            // Try to get price value from data attribute first
            if ($widget.data('efe-price-settings')) {
                try {
                    const settings = $widget.data('efe-price-settings');
                    priceValue = settings.price_value || '';
                } catch (e) {
                    console.error('Error loading price settings:', e);
                }
            }
            
            // If no stored price value, extract from heading text
            if (!priceValue) {
                // Remove all currency symbols to get just the numeric value
                priceValue = headingText.replace(/[€$£¥₽₣Fr.\s]/g, '').trim();
            }
            
            // Populate simplified form
            $('#efe-price-heading-widget-id').val(widgetId);
            $('#efe-price-heading-post-id').val(postId);
            $('#efe-price-heading-value').val(priceValue);
            
            // Show modal
            $('#efe-price-heading-editor').show();
        },
        
        /**
         * Save price heading changes (simplified - uses global currency settings)
         */
        savePriceHeading: function(e) {
            e.preventDefault();
            e.stopPropagation();
        
            const widgetId = $('#efe-price-heading-widget-id').val();
            const postId = $('#efe-price-heading-post-id').val();
            const priceValue = $('#efe-price-heading-value').val();
            
            // Get global currency settings
            const globalSettings = EFE.GlobalCurrency.getCurrentSettings();
        
            // Use the stored reference instead of looking up by ID
            const $widget = window.currentEditingWidget;
            if (!$widget || $widget.length === 0) {
                console.error('Widget not found: Reference lost');
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }
        
            // Check if this is a duplicated widget or new dish widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const isInNewDish = $widget.data('is-new-dish') === true;
            const operationId = $widget.closest('.efe-pending-duplication').data('operation-id');
            const duplicateSectionId = isInDuplicate ? $widget.closest('.efe-pending-duplication').data('section-id') : '';
            const widgetIndex = $widget.data('widget-index');
            
            // Format the price using global settings
            let formattedPrice = priceValue;
            if (globalSettings.show_currency && priceValue) {
                formattedPrice = (globalSettings.currency_position === 'before') ? 
                    globalSettings.currency + priceValue : 
                    priceValue + globalSettings.currency;
            }
        
            // Simple DOM update for visual preview
            const $heading = $widget.find('h1, h2, h3, h4, h5, h6');
            if ($heading.length) {
                $heading.html(formattedPrice);
            }
        
            // Store price data as data attribute on the widget for reference during duplication
            $widget.attr('data-price-settings', JSON.stringify({
                price_value: priceValue,
                currency: globalSettings.currency,
                currency_position: globalSettings.currency_position,
                show_currency: globalSettings.show_currency ? 1 : 0
            }));
            
            // Update widget's data attribute for GlobalCurrency module
            $widget.data('efe-price-settings', {
                price_value: priceValue,
                currency: globalSettings.currency,
                currency_position: globalSettings.currency_position,
                show_currency: globalSettings.show_currency
            });
        
            // Store change with EditorManager with duplication metadata and global settings
            const changeData = {
                widgetId: widgetId,
                postId: postId,
                widgetType: 'price-heading',
                price_value: priceValue,
                currency: globalSettings.currency,
                currency_position: globalSettings.currency_position,
                show_currency: globalSettings.show_currency ? 1 : 0
            };
            
            // Add duplication info if the widget is in a duplicated section or new dish
            if (isInDuplicate || isInNewDish) {
                changeData.isInDuplicate = true;
                changeData.isNewDish = isInNewDish;
                changeData.operationId = operationId;
                changeData.duplicateSectionId = duplicateSectionId;
                changeData.index = widgetIndex || $widget.data('index') || $widget.index();
            }
        
            EFE.EditorManager.addChange('widget', changeData);
        
            // Clear the reference
            window.currentEditingWidget = null;
        
            // Close modal
            EFE.ModalHandler.closeModals();
        
            // Show success notification
            EFE.Utils.showNotification('Prezzo aggiornato con impostazioni globali', 'success');
        },
        
        /**
         * Handle media uploader for images - FIXED VERSION
         */
        openMediaUploader: function(e) {
            e.preventDefault();
            e.stopPropagation();
        
            const widgetId = $('#efe-image-widget-id').val();
            const postId = $('#efe-image-post-id').val();
        
            // Find the widget
            const $widget = $('[data-widget-id="' + widgetId + '"]');
        
            if ($widget.length === 0) {
                console.error('Widget not found for image update:', widgetId);
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }
        
            // Check if this is a duplicated widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const operationId = $widget.data('operation-id');
        

        
            const mediaUploader = wp.media({
                title: 'Seleziona immagine',
                button: {
                    text: 'Usa questa immagine'
                },
                multiple: false
            });
        
            mediaUploader.on('select', function() {
                const attachment = mediaUploader.state().get('selection').first().toJSON();

        
                // 1. Update modal preview
                $('#efe-image-preview').html('<img src="' + attachment.url + '" alt="" style="max-width:100%;">');
                $('#efe-image-id').val(attachment.id);
        
                // 2. Immediate DOM update for visual feedback (IMPORTANT)
                const originalContent = $widget.html(); // Save original for restoration if needed
                $widget.attr('data-original-content', originalContent);
        
                // Create new image element with forced cache refresh
                const newImg = new Image();
                newImg.src = attachment.url + '?t=' + new Date().getTime(); 
                newImg.alt = attachment.alt || '';
                newImg.className = 'elementor-widget-image-preview';
                newImg.style.width = '100%';
                newImg.style.maxWidth = '100%';
        
                // Create a container with visual indicator
                const container = document.createElement('div');
                container.className = 'elementor-image-temp-preview';
                container.style.width = '100%';
                container.style.outline = '2px dashed #4CAF50';
                container.style.padding = '10px';
                container.appendChild(newImg);
        
                // Clear widget and append new content
                $widget.html('');
                $widget.append(container);
                $widget.append('<div class="efe-preview-notice" style="text-align:center;background:#4CAF50;color:white;padding:5px;margin-top:5px;font-size:12px;">Anteprima immagine</div>');
        
                // 3. Store the change with additional tracking info
                EFE.EditorManager.addChange('widget', {
                    widgetId: widgetId,
                    postId: postId,
                    widgetType: 'image',
                    imageId: attachment.id,
                    isInDuplicate: isInDuplicate,
                    operationId: operationId,
                    index: $widget.data('index')
                });
        
                // 4. Close modal and show notification
                EFE.ModalHandler.closeModals();
                EFE.Utils.showNotification('Immagine aggiornata', 'success');
        
                // 5. Refresh attribute indicators to ensure icon visibility is maintained
                if (EFE.EditorManager && EFE.EditorManager.refreshAttributeIndicators) {
                    EFE.EditorManager.refreshAttributeIndicators();
                }
            });
        
            mediaUploader.open();
        },
        
        /**
         * Save heading changes
         */
        saveHeading: function(e) {
            e.preventDefault();
            e.stopPropagation();

            const $form = $(e.currentTarget);
            const widgetId = $('#efe-heading-widget-id').val();
            const postId = $('#efe-heading-post-id').val();
            const title = $('#efe-heading-title').val();



            // Use the stored reference instead of looking up by ID
            const $widget = window.currentEditingWidget;

            if (!$widget || $widget.length === 0) {
                console.error('Widget not found: Reference lost');
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }

            // Check if this is a duplicated widget or new dish widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const isInNewDish = $widget.data('is-new-dish') === true;
            const operationId = $widget.data('operation-id');
            const widgetIndex = $widget.data('widget-index');

            // Update the widget in the DOM
            const $heading = $widget.find('h1, h2, h3, h4, h5, h6');
            if ($heading.length) {
                $heading.text(title);
            }

            // Store the change with additional tracking info
            EFE.EditorManager.addChange('widget', {
                widgetId: widgetId,
                postId: postId,
                widgetType: 'heading',
                title: title,
                isInDuplicate: isInDuplicate,
                isNewDish: isInNewDish,
                operationId: operationId,
                index: widgetIndex || $widget.data('index')
            });

            // Clear the reference
            window.currentEditingWidget = null;

            // Close modal
            EFE.ModalHandler.closeModals();

            // Refresh attribute indicators to ensure icon visibility is maintained
            if (EFE.EditorManager && EFE.EditorManager.refreshAttributeIndicators) {
                EFE.EditorManager.refreshAttributeIndicators();
            }

            // Show success notification
            EFE.Utils.showNotification('Titolo aggiornato', 'success');
        },
        
        /**
         * Save text editor changes
         */
        saveText: function(e) {
            e.preventDefault();
            e.stopPropagation();

            const $form = $(e.currentTarget);
            const widgetId = $('#efe-text-widget-id').val();
            const postId = $('#efe-text-post-id').val();
            const newText = $('#efe-text-content').val();



            // Use the stored reference instead of looking up by ID
            const $widget = window.currentEditingWidget;

            if (!$widget || $widget.length === 0) {
                console.error('Widget not found: Reference lost');
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }

            // Check if this is a duplicated widget or new dish widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const isInNewDish = $widget.data('is-new-dish') === true;
            const operationId = $widget.data('operation-id');
            const widgetIndex = $widget.data('widget-index');

            // Prepare user-entered text
            const cleanText = newText.trim();

            // Simpler solution: always wrap text in a paragraph
            const updatedHtml = '<p>' + cleanText + '</p>';

            // Update widget in DOM for visual feedback
            if ($widget.find('.elementor-text-editor').length) {
                $widget.find('.elementor-text-editor').html(updatedHtml);
            } else if ($widget.find('[class*="text-editor"]').length) {
                $widget.find('[class*="text-editor"]').html(updatedHtml);
            } else {
                $widget.html(updatedHtml);
            }

            // Store the change with additional tracking info
            EFE.EditorManager.addChange('widget', {
                widgetId: widgetId,
                postId: postId,
                widgetType: 'text-editor',
                content: updatedHtml,
                isInDuplicate: isInDuplicate,
                isNewDish: isInNewDish,
                operationId: operationId,
                index: widgetIndex || $widget.data('index')
            });

            // Clear the reference
            window.currentEditingWidget = null;

            // Close modal
            EFE.ModalHandler.closeModals();

            // Refresh attribute indicators to ensure icon visibility is maintained
            if (EFE.EditorManager && EFE.EditorManager.refreshAttributeIndicators) {
                EFE.EditorManager.refreshAttributeIndicators();
            }

            // Show success notification
            EFE.Utils.showNotification('Testo aggiornato', 'success');
        },
        
        /**
         * Save image changes
         */
        saveImage: function(e) {
            // If it's a real event (not our auto-save), prevent default behavior
            if (e.type !== 'auto-save') {
                e.preventDefault();
                e.stopPropagation();
            }
        
            const $form = $(e.currentTarget);
            const widgetId = $('#efe-image-widget-id').val();
            const postId = $('#efe-image-post-id').val();
            const imageId = $('#efe-image-id').val();
        


            if (!imageId) {
                EFE.Utils.showNotification('Seleziona un\'immagine prima di salvare.', 'warning');
                return;
            }

            // Use the stored reference instead of looking up by ID
            const $widget = window.currentEditingWidget;

            if (!$widget || $widget.length === 0) {
                console.error('Widget not found: Reference lost');
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }

            // Check if this is a duplicated widget or new dish widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const isInNewDish = $widget.data('is-new-dish') === true;
            const operationId = $widget.data('operation-id');
            const widgetIndex = $widget.data('widget-index');

            // Update widget in DOM for visual feedback
            // First, get the selected image details
            const selectedImageUrl = $('#efe-image-preview img').attr('src');
            
            if (selectedImageUrl) {
                // Find the image element within the widget
                const $img = $widget.find('img');
                
                if ($img.length) {
                    // Update image source
                    $img.attr('src', selectedImageUrl);
                    
                    // Update image ID-related classes if necessary
                    $img.removeClass(function(index, className) {
                        return (className.match(/wp-image-\d+/) || []).join(' ');
                    }).addClass('wp-image-' + imageId);
                } else {
                    // If no existing image, create a new one
                    const newImg = $('<img>', {
                        src: selectedImageUrl,
                        alt: '',
                        class: 'wp-image-' + imageId,
                        style: 'width:100%; max-width:100%;'
                    });
                    
                    // Append to widget, replacing existing content
                    $widget.html(newImg);
                }
            }

            // Store the change with additional tracking info
            EFE.EditorManager.addChange('widget', {
                widgetId: widgetId,
                postId: postId,
                widgetType: 'image',
                imageId: imageId,
                isInDuplicate: isInDuplicate,
                isNewDish: isInNewDish,
                operationId: operationId,
                index: widgetIndex || $widget.data('index')
            });

            // Clear the reference
            window.currentEditingWidget = null;

            // Close modal
            EFE.ModalHandler.closeModals();

            // Refresh attribute indicators to ensure icon visibility is maintained
            if (EFE.EditorManager && EFE.EditorManager.refreshAttributeIndicators) {
                EFE.EditorManager.refreshAttributeIndicators();
            }

            // Show success notification
            EFE.Utils.showNotification('Immagine aggiornata', 'success');
        },
        
        /**
         * Save price changes
         */
        savePrice: function(e) {
            e.preventDefault();
            e.stopPropagation();

            const $form = $(e.currentTarget);
            const widgetId = $('#efe-price-widget-id').val();
            const postId = $('#efe-price-post-id').val();
            const price = $('#efe-price-value').val();



            // Use the stored reference instead of looking up by ID
            const $widget = window.currentEditingWidget;

            if (!$widget || $widget.length === 0) {
                console.error('Widget not found: Reference lost');
                EFE.Utils.showNotification('Widget non trovato', 'error');
                return;
            }

            // Check if this is a duplicated widget or new dish widget
            const isInDuplicate = $widget.closest('.efe-pending-duplication').length > 0;
            const isInNewDish = $widget.data('is-new-dish') === true;
            const operationId = $widget.data('operation-id');
            const widgetIndex = $widget.data('widget-index');

            // Update widget in DOM for visual feedback
            if ($widget.find('.elementor-price-table__price').length) {
                // Handle price table widget
                $widget.find('.elementor-price-table__integer-part').text(price);
            } else if ($widget.find('.elementor-price-list__price').length) {
                // Handle price list widget
                $widget.find('.elementor-price-list__price').text(price);
            } else if ($widget.find('[class*="price"]').length) {
                // Generic approach
                $widget.find('[class*="price"]').first().text(price);
            }

            // Store the change with additional tracking info
            EFE.EditorManager.addChange('widget', {
                widgetId: widgetId,
                postId: postId,
                widgetType: 'price-table', // Default to price-table
                price: price,
                isInDuplicate: isInDuplicate,
                isNewDish: isInNewDish,
                operationId: operationId,
                index: widgetIndex || $widget.data('index')
            });

            // Clear the reference
            window.currentEditingWidget = null;

            // Close modal
            EFE.ModalHandler.closeModals();

            // Refresh attribute indicators to ensure icon visibility is maintained
            if (EFE.EditorManager && EFE.EditorManager.refreshAttributeIndicators) {
                EFE.EditorManager.refreshAttributeIndicators();
            }

            // Show success notification
            EFE.Utils.showNotification('Prezzo aggiornato', 'success');
        }
    };
})(jQuery);