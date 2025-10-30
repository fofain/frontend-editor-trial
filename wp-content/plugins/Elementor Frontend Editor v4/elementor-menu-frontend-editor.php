<?php
/**
 * Plugin Name: Elementor Menu Frontend Editor
 * Description: Permette ai ristoratori di modificare i contenuti dei widget Elementor dal front-end
 * Version: 1.4
 * Author: Fofain
 */

/**
 * Create a new user role (Restaurant Editor) based on Editor capabilities but with hidden admin bar
 */
function create_restaurant_editor_role() {
    // Get the capabilities of the Editor role
    $editor = get_role('editor');
    
    // Only create the role if it doesn't exist already
    if (!get_role('restaurant_editor')) {
        // Add a new role with the same capabilities as Editor
        add_role(
            'restaurant_editor',
            'Restaurant Editor',
            $editor ? $editor->capabilities : array()
        );
    }
}

/**
 * Hide admin bar for specific user roles
 */
function hide_admin_bar_for_restaurant_editors() {
    $current_user = wp_get_current_user();
    
    // If user has the restaurant_editor role, hide admin bar
    if (in_array('restaurant_editor', (array) $current_user->roles)) {
        show_admin_bar(false);
    }
}

// Impedisci l'accesso diretto
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('EFE_VERSION', '1.4.0');
define('EFE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('EFE_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load required files
require_once EFE_PLUGIN_DIR . 'includes/class-core.php';
require_once EFE_PLUGIN_DIR . 'includes/class-assets-manager.php';
require_once EFE_PLUGIN_DIR . 'includes/class-editor-ui.php';
require_once EFE_PLUGIN_DIR . 'includes/class-ajax-handler.php';
require_once EFE_PLUGIN_DIR . 'includes/class-widget-handler.php';
require_once EFE_PLUGIN_DIR . 'includes/class-section-handler.php';
require_once EFE_PLUGIN_DIR . 'includes/class-dish-attributes.php';
require_once EFE_PLUGIN_DIR . 'includes/class-allergen-attributes.php';

// Initialize the plugin
function efe_initialize_plugin() {
    // Check if Elementor is active
    if (!function_exists('is_plugin_active')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    
    // Initialize the plugin only if Elementor is available
    if (EFE_Core::check_elementor_active()) {
        $core = new EFE_Core();
        $core->initialize();
    } else {
        // Show admin notice if Elementor is not active
        add_action('admin_notices', 'efe_show_elementor_missing_notice');
    }
    
    // Hook to hide admin bar for restaurant editors
    add_action('after_setup_theme', 'hide_admin_bar_for_restaurant_editors');
}

// Admin notice for missing Elementor
function efe_show_elementor_missing_notice() {
    if (current_user_can('activate_plugins')) {
        echo '<div class="notice notice-warning is-dismissible">';
        echo '<p>' . __('Elementor Menu Frontend Editor richiede Elementor per funzionare. Per favore, assicurati che Elementor sia installato e attivato.', 'elementor-frontend-editor') . '</p>';
        echo '</div>';
    }
}

// Hook initialization to plugins_loaded to ensure all plugins are loaded first
add_action('plugins_loaded', 'efe_initialize_plugin');

// Register activation and deactivation hooks
register_activation_hook(__FILE__, 'efe_plugin_activation');
register_deactivation_hook(__FILE__, 'efe_plugin_deactivation');

// Plugin activation function
function efe_plugin_activation() {
    // Create the custom role for restaurant editors
    create_restaurant_editor_role();
    
    // Add any activation setup here
    flush_rewrite_rules();
}

// Plugin deactivation function
function efe_plugin_deactivation() {
    // Add any cleanup on deactivation
    flush_rewrite_rules();
}
