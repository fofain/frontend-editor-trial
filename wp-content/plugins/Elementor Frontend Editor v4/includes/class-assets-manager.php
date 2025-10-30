<?php
/**
 * Assets Manager Class
 * Handles registration and enqueuing of plugin scripts and styles
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Assets_Manager {
    
    /**
     * Initialize the assets manager
     */
    public function init() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }
    
    /**
     * Register and enqueue scripts and styles
     */
    public function enqueue_assets() {
        // Register and enqueue styles
        wp_enqueue_style(
            'elementor-frontend-editor',
            EFE_PLUGIN_URL . 'assets/css/elementor-frontend-editor.css',
            array(),
            EFE_VERSION
        );
        
        // Load scripts only for authorized users
        if (current_user_can('edit_posts')) {
            // First register JS modules
            $this->register_js_modules();
            
            // Then register and enqueue main script
            wp_enqueue_script(
                'elementor-frontend-editor',
                EFE_PLUGIN_URL . 'assets/js/elementor-frontend-editor.js',
                array('jquery'),
                EFE_VERSION,
                true
            );
            
            // Add WordPress media uploader
            wp_enqueue_media();
            
            // Pass data to JavaScript
            wp_localize_script('elementor-frontend-editor', 'efe_data', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('elementor_frontend_editor_nonce'),
                'strings' => array(
                    'saving' => __('Salvataggio in corso...', 'elementor-frontend-editor'),
                    'success' => __('Modifiche salvate con successo!', 'elementor-frontend-editor'),
                    'error' => __('Si è verificato un errore durante il salvataggio.', 'elementor-frontend-editor'),
                    'confirm_exit' => __('Hai delle modifiche non salvate. Sei sicuro di voler uscire?', 'elementor-frontend-editor'),
                    'confirm_delete' => __('Sei sicuro di voler eliminare questa sezione? L\'operazione non può essere annullata.', 'elementor-frontend-editor'),
                    'section_deleted' => __('Sezione eliminata con successo!', 'elementor-frontend-editor'),
                    'section_added' => __('Nuova sezione aggiunta con successo!', 'elementor-frontend-editor'),
                    'section_moved' => __('Sezione spostata con successo!', 'elementor-frontend-editor')
                )
            ));
        }
    }
    
    /**
     * Register JavaScript modules
     * These need to be registered and enqueued BEFORE the main script
     */
        private function register_js_modules() {
            $modules = array(
                'utils',           // Load utils first
                'ajax-handler',    // Then Ajax handler
                'modal-handler',   // Then modals
                'editor-manager',  // Then editor manager (core)
                'widget-editor',
                'section-manager',
                'dish-attributes',
                'allergen-attributes',
                'global-currency'  // Global currency module
            );
        
        // Important: enqueue them in the correct dependency order
        foreach ($modules as $module) {
            wp_enqueue_script(
                'efe-' . $module,
                EFE_PLUGIN_URL . 'assets/js/modules/' . $module . '.js',
                array('jquery'),
                EFE_VERSION,
                true
            );
        }
    }
}
