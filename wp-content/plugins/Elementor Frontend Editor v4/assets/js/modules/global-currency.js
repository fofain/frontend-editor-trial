/**
 * Global Currency Module for Elementor Menu Frontend Editor
 * Handles global currency settings for all price headings
 */
var EFE = EFE || {};

EFE.GlobalCurrency = (function($) {
    'use strict';
    
    // Private variables
    let currentSettings = {
        currency: '€',
        currency_position: 'before',
        show_currency: true
    };
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
            console.log('EFE Global Currency: Initializing...');
            this.loadCurrentSettings();
            this.setupEventHandlers();
            console.log('EFE Global Currency: Initialization complete');
        },
        
        /**
         * Setup event handlers
         */
        setupEventHandlers: function() {
            // Global currency button click
            $('body').on('click', '#efe-global-currency-btn', function(e) {
                console.log('EFE Global Currency: Button clicked!');
                e.preventDefault();
                e.stopPropagation();
                EFE.GlobalCurrency.openEditor();
            });
            
            // Global currency form submission
            $('body').on('submit', '#efe-global-currency-form', function(e) {
                e.preventDefault();
                e.stopPropagation();
                EFE.GlobalCurrency.saveGlobalSettings(e);
            });
        },
        
        /**
         * Load current global currency settings
         */
        loadCurrentSettings: function() {
            // Try to detect current settings from first price heading found
            const $firstPriceHeading = $('.efe-editable-widget[data-widget-type="price-heading"]').first();
            
            if ($firstPriceHeading.length && $firstPriceHeading.data('efe-price-settings')) {
                try {
                    const settings = $firstPriceHeading.data('efe-price-settings');
                    currentSettings = {
                        currency: settings.currency || '€',
                        currency_position: settings.currency_position || 'before',
                        show_currency: settings.show_currency !== undefined ? settings.show_currency : true
                    };
                } catch (e) {
                    console.log('Error loading current settings:', e);
                }
            } else {
                // Try to extract from first price heading's text
                if ($firstPriceHeading.length) {
                    const headingText = $firstPriceHeading.find('h1, h2, h3, h4, h5, h6').text().trim();
                    this.extractSettingsFromText(headingText);
                }
            }
            
            // Update currency button icon
            this.updateCurrencyButtonIcon();
        },
        
        /**
         * Extract currency settings from heading text
         */
        extractSettingsFromText: function(text) {
            const currencies = ['€', '$', '£', '¥', '₽', '₣', 'Fr.'];
            
            for (const curr of currencies) {
                if (text.includes(curr)) {
                    currentSettings.currency = curr;
                    currentSettings.show_currency = true;
                    
                    // Determine position
                    if (text.indexOf(curr) === 0) {
                        currentSettings.currency_position = 'before';
                    } else {
                        currentSettings.currency_position = 'after';
                    }
                    break;
                }
            }
        },
        
        /**
         * Update the currency button icon
         */
        updateCurrencyButtonIcon: function() {
            const $icon = $('#efe-global-currency-btn .efe-currency-icon');
            if ($icon.length) {
                $icon.text(currentSettings.currency);
            }
        },
        
        /**
         * Open global currency editor
         */
        openEditor: function() {
            console.log('EFE Global Currency: Opening editor...');
            // Populate form with current settings
            $('#efe-global-post-id').val(this.getCurrentPostId());
            $('#efe-global-currency').val(currentSettings.currency);
            
            if (currentSettings.currency_position === 'before') {
                $('#efe-global-currency-position-before').prop('checked', true);
            } else {
                $('#efe-global-currency-position-after').prop('checked', true);
            }
            
            $('#efe-global-show-currency').prop('checked', currentSettings.show_currency);
            
            // Show modal
            $('#efe-global-currency-editor').show();
        },
        
        /**
         * Save global currency settings
         */
        saveGlobalSettings: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get form values
            const postId = $('#efe-global-post-id').val();
            const currency = $('#efe-global-currency').val();
            const currencyPosition = $('input[name="currency_position"]:checked').val();
            const showCurrency = $('#efe-global-show-currency').is(':checked');
            
            // Validate
            if (!postId) {
                EFE.Utils.showNotification('Errore: ID post non trovato', 'error');
                return;
            }
            
            // Show loading notification
            EFE.Utils.showNotification('Applicazione impostazioni valuta...', 'info');
            
            // Update current settings
            currentSettings = {
                currency: currency,
                currency_position: currencyPosition,
                show_currency: showCurrency
            };
            
            // Update currency button icon immediately
            this.updateCurrencyButtonIcon();
            
            // Apply changes to all visible price headings immediately (visual preview)
            this.updateAllVisiblePriceHeadings();
            
            // Send AJAX request to save globally
            const data = {
                action: 'save_global_currency_settings',
                nonce: efe_data.nonce,
                post_id: postId,
                currency: currency,
                currency_position: currencyPosition,
                show_currency: showCurrency ? 1 : 0
            };
            
            $.post(efe_data.ajax_url, data, function(response) {
                if (response.success) {
                    EFE.Utils.showNotification(
                        'Impostazioni valuta applicate a ' + response.data.updated_count + ' prezzi', 
                        'success'
                    );
                } else {
                    EFE.Utils.showNotification(
                        'Errore durante il salvataggio: ' + (response.data.message || 'Errore sconosciuto'), 
                        'error'
                    );
                }
            }).fail(function() {
                EFE.Utils.showNotification('Errore di comunicazione con il server', 'error');
            });
            
            // Close modal
            EFE.ModalHandler.closeModals();
        },
        
        /**
         * Update all visible price headings with new currency settings (visual preview)
         */
        updateAllVisiblePriceHeadings: function() {
            $('.efe-editable-widget[data-widget-type="price-heading"]').each(function() {
                const $widget = $(this);
                const $heading = $widget.find('h1, h2, h3, h4, h5, h6');
                
                if ($heading.length) {
                    // Get current price value
                    let priceValue = '';
                    
                    // Try to get from data attribute first
                    const priceSettings = $widget.data('efe-price-settings');
                    if (priceSettings && priceSettings.price_value) {
                        priceValue = priceSettings.price_value;
                    } else {
                        // Extract from heading text
                        const headingText = $heading.text().trim();
                        priceValue = headingText.replace(/[€$£¥₽₣Fr.\s]/g, '').trim();
                    }
                    
                    // Format with new settings
                    let formattedPrice = priceValue;
                    if (currentSettings.show_currency && priceValue) {
                        formattedPrice = (currentSettings.currency_position === 'before') ? 
                            currentSettings.currency + priceValue : 
                            priceValue + currentSettings.currency;
                    }
                    
                    // Update heading
                    $heading.text(formattedPrice);
                    
                    // Update data attribute for future reference
                    $widget.data('efe-price-settings', {
                        price_value: priceValue,
                        currency: currentSettings.currency,
                        currency_position: currentSettings.currency_position,
                        show_currency: currentSettings.show_currency
                    });
                }
            });
        },
        
        /**
         * Get current post ID
         */
        getCurrentPostId: function() {
            // Try multiple methods to get post ID
            let postId = '';
            
            // Method 1: From a price heading widget
            const $widget = $('.efe-editable-widget[data-post-id]').first();
            if ($widget.length) {
                postId = $widget.data('post-id');
            }
            
            // Method 2: From body data attribute
            if (!postId) {
                postId = $('body').data('post-id') || document.body.dataset.postId;
            }
            
            // Method 3: From global WordPress variable
            if (!postId && typeof window.efe_data !== 'undefined' && window.efe_data.post_id) {
                postId = window.efe_data.post_id;
            }
            
            return postId || '';
        },
        
        /**
         * Get current currency settings
         */
        getCurrentSettings: function() {
            return currentSettings;
        },
        
        /**
         * Set currency settings (for external use)
         */
        setCurrentSettings: function(settings) {
            currentSettings = Object.assign(currentSettings, settings);
            this.updateCurrencyButtonIcon();
        }
    };
})(jQuery);
