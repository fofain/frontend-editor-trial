<?php
/**
 * Widget Handler Class
 * Handles operations on Elementor widgets
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Widget_Handler {
    
    /**
     * Initialize the widget handler
     */
    public function init() {
        // Add attributes to Elementor widgets
        add_action('elementor/frontend/widget/before_render', array($this, 'add_widget_attributes'), 10, 2);
    }
    
    /**
     * Check if an element is editable
     */
    public function is_element_editable($element) {
        $settings = $element->get_settings_for_display();
        
        // Check 1: if element has CSS class 'editable'
        $has_editable_class = false;
        $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : '';
        if (!empty($css_classes) && strpos($css_classes, 'editable') !== false) {
            $has_editable_class = true;
        }
        
        // Check 2: if element has ID with 'editable'
        $has_editable_id = false;
        $css_id = isset($settings['_element_id']) ? $settings['_element_id'] : '';
        if (!empty($css_id) && strpos($css_id, 'editable') !== false) {
            $has_editable_id = true;
        }
        
        // Check 3: if element has custom HTML attributes
        $has_editable_attribute = false;
        if (isset($settings['_attributes']) && is_array($settings['_attributes'])) {
            foreach ($settings['_attributes'] as $attr) {
                if ((isset($attr['key']) && $attr['key'] === 'data-editable' && isset($attr['value']) && $attr['value'] === 'true') ||
                    (isset($attr['key']) && $attr['key'] === 'data-editable-section' && isset($attr['value']) && $attr['value'] === 'true')) {
                    $has_editable_attribute = true;
                    break;
                }
            }
        }
        
        return $has_editable_class || $has_editable_id || $has_editable_attribute;
    }
    
    /**
     * Check if a widget is a price heading
     */
    public function is_price_heading($element) {
        // First check if it's a heading widget
        if ($element->get_name() !== 'heading') {
            return false;
        }
        
        $settings = $element->get_settings_for_display();
        
        // Check if element has CSS class 'editable' and 'price'
        $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : '';
        if (!empty($css_classes) && strpos($css_classes, 'editable') !== false && strpos($css_classes, 'price') !== false) {
            return true;
        }
        
        // Check if element has ID with 'editable-price'
        $css_id = isset($settings['_element_id']) ? $settings['_element_id'] : '';
        if (!empty($css_id) && strpos($css_id, 'editable-price') !== false) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Add attributes to widgets for frontend editing
     */
    public function add_widget_attributes($widget, $instance = null) {
        $settings = $widget->get_settings_for_display();
        $widget_type = $widget->get_name();
        
        // Check for category-title headings
        if ($widget_type === 'heading' && current_user_can('edit_posts')) {
            if ($this->is_heading_category_title($widget)) {
                // Get widget ID
                $widget_id = $widget->get_id();
                
                // Add data attributes to identify widget as a category title
                $widget->add_render_attribute('_wrapper', [
                    'class' => 'efe-editable-widget efe-category-title-heading',
                    'data-widget-id' => $widget_id,
                    'data-widget-type' => $widget_type,
                    'data-post-id' => get_the_ID(),
                    'data-elementor-id' => $widget_id,
                    'data-is-category-title' => 'true'
                ]);
                
                return; // Skip other checks for category-title headings
            }
            
            // Check for price headings
            if ($this->is_price_heading($widget)) {
                // Get widget ID
                $widget_id = $widget->get_id();
                $settings = $widget->get_settings_for_display();
                
                // Get price settings from widget settings
                $price_value = isset($settings['efe_price_value']) ? $settings['efe_price_value'] : '';
                $currency = isset($settings['efe_currency']) ? $settings['efe_currency'] : '€';
                $currency_position = isset($settings['efe_currency_position']) ? $settings['efe_currency_position'] : 'before';
                $show_currency = isset($settings['efe_show_currency']) ? $settings['efe_show_currency'] : true;
                
                // Encode price settings as JSON
                $price_settings_json = htmlspecialchars(json_encode([
                    'price_value' => $price_value,
                    'currency' => $currency,
                    'currency_position' => $currency_position,
                    'show_currency' => $show_currency
                ]), ENT_QUOTES, 'UTF-8');
                
                // Add data attributes to identify widget as a price heading
                $widget->add_render_attribute('_wrapper', [
                    'class' => 'efe-editable-widget efe-price-heading',
                    'data-widget-id' => $widget_id,
                    'data-widget-type' => 'price-heading',
                    'data-post-id' => get_the_ID(),
                    'data-elementor-id' => $widget_id,
                    'data-is-price-heading' => 'true',
                    'data-efe-price-settings' => $price_settings_json
                ]);
                
                return; // Skip other checks for price headings
            }
        }
        
        // Identify widgets that we want to make editable
        $editable_widget_types = array('heading', 'text-editor', 'image', 'price-table', 'price-list');
        
        // Make widget editable only if it's a supported type AND has the 'editable' tag
        if (in_array($widget_type, $editable_widget_types) && current_user_can('edit_posts')) {
            if ($this->is_element_editable($widget)) {
                // Get widget ID
                $widget_id = $widget->get_id();
                
                // Add data attributes to identify widget as editable
                $widget->add_render_attribute('_wrapper', [
                    'class' => 'efe-editable-widget',
                    'data-widget-id' => $widget_id,
                    'data-widget-type' => $widget_type,
                    'data-post-id' => get_the_ID(),
                    'data-elementor-id' => $widget_id
                ]);
            }
        }
    }
    
    /**
     * Find and update a widget in Elementor data
     */
    public static function find_and_update_widget(&$elements, $widget_id, $widget_type, $form_data) {
        foreach ($elements as &$element) {
            // Case 1: Found the widget we're looking for
            if (isset($element['id']) && $element['id'] === $widget_id) {
                // Update widget based on type
                switch ($widget_type) {
                    case 'heading':
                        if (isset($form_data['title'])) {
                            $element['settings']['title'] = wp_kses_post($form_data['title']);
                        }
                        break;
                        
                    case 'price-heading':
                        // Format the price with currency
                        $price_value = isset($form_data['price_value']) ? $form_data['price_value'] : '';
                        $currency = isset($form_data['currency']) ? $form_data['currency'] : '€';
                        $currency_position = isset($form_data['currency_position']) ? $form_data['currency_position'] : 'before';
                        $show_currency = isset($form_data['show_currency']) ? (bool)$form_data['show_currency'] : true;
                        
                        // Format the price
                        $formatted_price = $price_value;
                        if ($show_currency) {
                            $formatted_price = ($currency_position === 'before') ? 
                                $currency . $price_value : 
                                $price_value . $currency;
                        }
                        
                    // Update the title setting like a normal heading
                    $element['settings']['title'] = wp_kses_post($formatted_price);
                    
                    // IMPORTANT CHANGE: Store price settings directly in the widget settings
                    // This ensures they're copied when a section is duplicated
                    $element['settings']['efe_price_value'] = $price_value;
                    $element['settings']['efe_currency'] = $currency;
                    $element['settings']['efe_currency_position'] = $currency_position;
                    $element['settings']['efe_show_currency'] = $show_currency;
                    
                    break;
                        
                    case 'text-editor':
                        if (isset($form_data['content'])) {
                            $element['settings']['editor'] = wp_kses_post($form_data['content']);
                        }
                        break;
                        
                    case 'image':
                        if (isset($form_data['image_id'])) {
                            $image_id = $form_data['image_id'];
                            
                            // Initialize image array if it doesn't exist
                            if (!isset($element['settings']['image']) || !is_array($element['settings']['image'])) {
                                $element['settings']['image'] = array();
                            }
                            
                            if ($image_id === '' || $image_id === 'placeholder') {
                                // This is a placeholder image
                                $element['settings']['image']['id'] = '';
                                $element['settings']['image']['url'] = '/wp-content/plugins/elementor/assets/images/placeholder.png';
                                $element['settings']['image']['alt'] = 'Placeholder';
                                $element['settings']['image']['width'] = '';
                                $element['settings']['image']['height'] = '';
                                $element['settings']['image']['size'] = 'full';
                            } else {
                                // This is a real image
                                $image_id = intval($image_id);
                                
                                // Get detailed image information
                                $attachment = get_post($image_id);
                                $attachment_url = wp_get_attachment_url($image_id);
                                $attachment_alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);

                                // Update the image settings with complete data
                                $element['settings']['image']['id'] = $image_id;
                                $element['settings']['image']['url'] = $attachment_url;

                                // Add alt text if available
                                if (!empty($attachment_alt)) {
                                    $element['settings']['image']['alt'] = $attachment_alt;
                                }

                                // Add title if available
                                if (!empty($attachment->post_title)) {
                                    $element['settings']['image']['title'] = $attachment->post_title;
                                }
                            }
                        }
                        break;
                        
                    case 'price-table':
                    case 'price-list':
                        if (isset($form_data['price'])) {
                            $element['settings']['price'] = sanitize_text_field($form_data['price']);
                        }
                        break;
                }
                
                return true;
            }
            
            // Case 2: Current element has child elements (container, section, column, etc.)
            if (isset($element['elements']) && is_array($element['elements'])) {
                // Search recursively among child elements
                if (self::find_and_update_widget($element['elements'], $widget_id, $widget_type, $form_data)) {
                    return true;
                }
            }
        }
        
        return false;
    }

        /**
     * Check if a widget is a category title heading
     */
    public function is_heading_category_title($widget) {
        // First check if it's a heading widget
        if ($widget->get_name() !== 'heading') {
            return false;
        }
        
        $settings = $widget->get_settings_for_display();
        
        // Check if element has CSS class 'category-title'
        $has_category_title_class = false;
        $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : '';
        if (!empty($css_classes) && strpos($css_classes, 'category-title') !== false) {
            $has_category_title_class = true;
        }
        
        // Check if element has ID with 'category-title'
        $has_category_title_id = false;
        $css_id = isset($settings['_element_id']) ? $settings['_element_id'] : '';
        if (!empty($css_id) && strpos($css_id, 'category-title') !== false) {
            $has_category_title_id = true;
        }
        
        // Check if element has custom HTML attributes
        $has_category_title_attribute = false;
        if (isset($settings['_attributes']) && is_array($settings['_attributes'])) {
            foreach ($settings['_attributes'] as $attr) {
                if (isset($attr['key']) && $attr['key'] === 'data-category-title' && isset($attr['value']) && $attr['value'] === 'true') {
                    $has_category_title_attribute = true;
                    break;
                }
            }
        }
        
        return $has_category_title_class || $has_category_title_id || $has_category_title_attribute;
    }
}
