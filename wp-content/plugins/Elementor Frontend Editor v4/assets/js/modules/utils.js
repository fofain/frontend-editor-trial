/**
 * Utils Module for Elementor Menu Frontend Editor
 * Provides utility functions for the editor
 */

// Ensure EFE namespace exists
window.EFE = window.EFE || {};

// Define the Utils module
window.EFE.Utils = (function($) {
    'use strict';
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
    
        },
        
        /**
         * Show a temporary notification
         */
        showNotification: function(message, type) {
            // Remove any existing notifications
            $('.efe-notification').remove();
            
            // Create notification element
            const $notification = $('<div class="efe-notification efe-notification-' + type + '">' + message + '</div>');
            $('body').append($notification);
            
            // Position notification at top-right
            $notification.css({
                'position': 'fixed',
                'top': '20px',
                'right': '20px',
                'z-index': '99999',
                'padding': '10px 20px',
                'border-radius': '4px',
                'background-color': type === 'success' ? '#4CAF50' : (type === 'error' ? '#F44336' : (type === 'warning' ? '#FF9800' : '#2196F3')),
                'color': 'white',
                'box-shadow': '0 2px 4px rgba(0,0,0,0.2)'
            });
            
            // Remove notification after 3 seconds
            setTimeout(function() {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        },
        
        /* Rest of the module code remains the same */
        
        /**
         * Strip HTML tags for display in editor and normalize whitespace
         */
        stripHtmlForDisplay: function(html) {
            // First, clean up whitespace between tags
            let cleanHtml = html.replace(/>\s+</g, '><');
            
            // Create a temporary div to handle the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanHtml;
            
            // Get the text content (strips all HTML)
            let textContent = tempDiv.textContent || tempDiv.innerText || '';
            
            // Normalize whitespace:
            // 1. Replace all consecutive whitespace (spaces, tabs, newlines) with a single space
            // 2. Trim leading and trailing whitespace
            // 3. Remove any non-breaking spaces as well
            return textContent.replace(/\s+/g, ' ').replace(/\u00A0/g, ' ').trim();
        },
        

    };
})(jQuery);
