/**
 * Modal Handler Module for Elementor Menu Frontend Editor
 * Handles modal operations
 */
var EFE = EFE || {};

EFE.ModalHandler = (function($) {
    'use strict';
    
    // Public methods
    return {
        /**
         * Initialize the module
         */
        init: function() {
    
        },
        
        /**
         * Close all open modals
         */
        closeModals: function() {
            // Explicitly hide each modal by ID for reliability
            $('#efe-heading-editor').hide();
            $('#efe-text-editor').hide();
            $('#efe-image-editor').hide();
            $('#efe-price-editor').hide();
            $('#efe-section-delete-confirm').hide();
            $('#efe-dish-attributes-editor').hide();
            $('#efe-allergen-attributes-editor').hide();
            $('#efe-global-currency-editor').hide();
            
            // Also use the generic selector for any modals we missed
            $('.efe-editor-modal').hide();
        
            // Add a force hide via CSS as well
            $('.efe-editor-modal').css('display', 'none');
        
            // Reset all forms to prevent browser tracking changes
            $('.efe-editor-modal form').each(function() {
                this.reset();
            });
        
            // Reset current section ID
            if (EFE.SectionManager && EFE.SectionManager.setCurrentSectionId) {
                EFE.SectionManager.setCurrentSectionId(null);
            }
            

        },
        
        /**
         * Open a specific modal
         */
        openModal: function(modalId) {
            if ($('#' + modalId).length) {
                this.closeModals(); // Close any open modals first
                $('#' + modalId).show();
                return true;
            }
            return false;
        }
    };
})(jQuery);
