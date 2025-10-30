/**
 * Main JavaScript file for Elementor Menu Frontend Editor
 * Version 1.4
 */

// Define the global namespace first
window.EFE = window.EFE || {};

(function($) {
    'use strict';
    
    // Initialize editor when document is ready
    $(document).ready(function() {
        // Initialize module loading
        initModules();
        
        // Setup main event listeners
        setupEventListeners();
    });
    
    /**
     * Initialize all modules
     * This must happen after all modules are loaded
     */
    function initModules() {
        // Check if modules are loaded correctly
        console.log('EFE: Checking modules...');
        console.log('EFE.GlobalCurrency loaded:', !!EFE.GlobalCurrency);
        
        if (!EFE.EditorManager || !EFE.WidgetEditor || !EFE.SectionManager || 
            !EFE.ModalHandler || !EFE.DishAttributes || !EFE.AllergenAttributes || 
            !EFE.GlobalCurrency || !EFE.Utils || !EFE.AjaxHandler) {
            console.error('Some EFE modules failed to load. Check script loading order.');
            console.log('Module status:', {
                EditorManager: !!EFE.EditorManager,
                WidgetEditor: !!EFE.WidgetEditor,
                SectionManager: !!EFE.SectionManager,
                ModalHandler: !!EFE.ModalHandler,
                DishAttributes: !!EFE.DishAttributes,
                AllergenAttributes: !!EFE.AllergenAttributes,
                GlobalCurrency: !!EFE.GlobalCurrency,
                Utils: !!EFE.Utils,
                AjaxHandler: !!EFE.AjaxHandler
            });
            return;
        }
        
        // Initialize modules
        if (EFE.Utils) EFE.Utils.init();
        if (EFE.AjaxHandler) EFE.AjaxHandler.init();
        if (EFE.ModalHandler) EFE.ModalHandler.init();
        if (EFE.EditorManager) EFE.EditorManager.init();
        if (EFE.WidgetEditor) EFE.WidgetEditor.init();
        if (EFE.SectionManager) EFE.SectionManager.init();
        if (EFE.DishAttributes) EFE.DishAttributes.init();
        if (EFE.AllergenAttributes) EFE.AllergenAttributes.init();
        if (EFE.GlobalCurrency) EFE.GlobalCurrency.init();
        

    }
    
    /**
     * Setup main event listeners
     */
    function setupEventListeners() {
        if (!EFE.EditorManager) {
            console.error('EditorManager module not loaded');
            return;
        }
        
        // Toggle edit mode button
        $('#toggle-elementor-edit').on('click', function(e) {
            e.preventDefault();
            if (EFE.EditorManager && EFE.EditorManager.toggleEditMode) {
                EFE.EditorManager.toggleEditMode();
            } else {
                console.error('EditorManager.toggleEditMode not available');
            }
        });
        
        // Widget editing events
        $('body').on('click', '.efe-editable-widget:not(.efe-highlight)', function(e) {
            if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                e.preventDefault();
                e.stopPropagation();
                if (EFE.WidgetEditor && EFE.WidgetEditor.highlightWidget) {
                    EFE.WidgetEditor.highlightWidget($(this));
                }
            }
        });
        
        $('body').on('click', '.efe-highlight', function(e) {
            if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                e.preventDefault();
                e.stopPropagation();
                if (EFE.WidgetEditor && EFE.WidgetEditor.openEditor) {
                    EFE.WidgetEditor.openEditor($(this));
                }
            }
        });
        
        // Section control events
        // Note: Section control handlers (delete, move, duplicate, attributes) are now 
        // handled in section-manager.js to avoid duplicate event handlers
        
        // Section controls toggle
        $('body').on('click', '.efe-section-toggle', function(e) {
            if (EFE.EditorManager && EFE.EditorManager.isEditModeActive()) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close all other expanded controls first
                $('.efe-section-controls.expanded').not($(this).closest('.efe-section-controls')).removeClass('expanded');
                
                // Toggle this control's expanded state
                $(this).closest('.efe-section-controls').toggleClass('expanded');
            }
        });
        
        // Form submission handlers
        $('#efe-heading-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.saveHeading) {
                EFE.WidgetEditor.saveHeading(e);
            }
        });
        
        $('#efe-text-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.saveText) {
                EFE.WidgetEditor.saveText(e);
            }
        });
        
        $('#efe-image-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.saveImage) {
                EFE.WidgetEditor.saveImage(e);
            }
        });
        
        $('#efe-price-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.savePrice) {
                EFE.WidgetEditor.savePrice(e);
            }
        });
        
        $('#efe-price-heading-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.savePriceHeading) {
                EFE.WidgetEditor.savePriceHeading(e);
            }
        });
        
        $('#efe-dish-attributes-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.DishAttributes && EFE.DishAttributes.saveAttributes) {
                EFE.DishAttributes.saveAttributes(e);
            }
        });
        
        $('#efe-allergen-attributes-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.AllergenAttributes && EFE.AllergenAttributes.saveAttributes) {
                EFE.AllergenAttributes.saveAttributes(e);
            }
        });
        
        // Media uploader
        $('#efe-select-image').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.WidgetEditor && EFE.WidgetEditor.openMediaUploader) {
                EFE.WidgetEditor.openMediaUploader(e);
            }
        });
        
        // Modal handlers
        $('.efe-close-modal, .efe-cancel-button').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.ModalHandler && EFE.ModalHandler.closeModals) {
                EFE.ModalHandler.closeModals();
            }
        });
        
        $(window).on('click', function(event) {
            if ($(event.target).hasClass('efe-editor-modal')) {
                if (EFE.ModalHandler && EFE.ModalHandler.closeModals) {
                    EFE.ModalHandler.closeModals();
                }
            }
        });
        
        // Delete section confirmation
        $('#confirm-delete-section').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (EFE.SectionManager && EFE.SectionManager.deleteCurrentSection) {
                EFE.SectionManager.deleteCurrentSection();
            }
        });
        
        // Control browser's native "unsaved changes" warning
        $(window).off('beforeunload'); // Remove any existing handlers
        $(window).on('beforeunload', function(e) {
            // Only show the warning if editor is active and changes exist
            if (EFE.EditorManager && 
                EFE.EditorManager.isEditModeActive && 
                EFE.EditorManager.hasUnsavedChanges && 
                EFE.EditorManager.isEditModeActive() && 
                EFE.EditorManager.hasUnsavedChanges()) {
                
                // This is the standard way to trigger the browser warning
                e.preventDefault();
                // The message text is controlled by the browser, not by this string
                return efe_data.strings.confirm_exit;
            }
        });
    }
    
})(jQuery);