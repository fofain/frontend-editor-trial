<?php
/**
 * Core class for Elementor Menu Frontend Editor
 * Handles plugin initialization and core functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Core {
    // Plugin instance
    private static $instance = null;
    
    // Class instances
    private $assets_manager;
    private $editor_ui;
    private $ajax_handler;
    private $widget_handler;
    private $section_handler;
    private $dish_attributes;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Initialize class properties
    }
    
    /**
     * Get plugin instance (Singleton pattern)
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Initialize the plugin
     */
    public function initialize() {
        // Initialize components
        $this->assets_manager = new EFE_Assets_Manager();
        $this->editor_ui = new EFE_Editor_UI();
        $this->ajax_handler = new EFE_AJAX_Handler();
        $this->widget_handler = new EFE_Widget_Handler();
        $this->section_handler = new EFE_Section_Handler();
        $this->dish_attributes = new EFE_Dish_Attributes();
        $this->allergen_attributes = new EFE_Allergen_Attributes();
        
        // Setup the plugin
        $this->setup_hooks();
        
        // Init components
        $this->assets_manager->init();
        $this->editor_ui->init();
        $this->ajax_handler->init();
        $this->widget_handler->init();
        $this->section_handler->init();
        $this->dish_attributes->init();
        $this->allergen_attributes->init();
    }
    
    /**
     * Setup hooks
     */
    private function setup_hooks() {
        // Add elementor widget attributes
        add_action('elementor/frontend/widget/before_render', array($this->widget_handler, 'add_widget_attributes'), 10, 2);
        add_action('elementor/frontend/section/before_render', array($this->section_handler, 'add_section_attributes'), 10, 1);
        add_action('elementor/frontend/column/before_render', array($this->section_handler, 'add_column_attributes'), 10, 1);
        add_action('elementor/frontend/container/before_render', array($this->section_handler, 'add_container_attributes'), 10, 1);
        

    }
    

    
    /**
     * Check if Elementor is active
     */
    public static function check_elementor_active() {
        // Metodo 1: Controlla se la classe principale di Elementor esiste
        if (class_exists('\Elementor\Plugin')) {
            return true;
        }
        
        // Metodo 2: Controlla se il plugin è attivo usando il percorso del file
        if (function_exists('is_plugin_active') && is_plugin_active('elementor/elementor.php')) {
            return true;
        }
        
        // Metodo 3: Controlla direttamente l'array dei plugin attivi
        $active_plugins = get_option('active_plugins');
        if (is_array($active_plugins)) {
            foreach ($active_plugins as $plugin) {
                if (strpos($plugin, 'elementor.php') !== false) {
                    return true;
                }
            }
        }
        
        return false;
    }
}