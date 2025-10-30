<?php
/**
 * Dish Attributes Class
 * Handles dish attributes functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Dish_Attributes {
    
    /**
     * Initialize dish attributes handler
     */
    public function init() {
        // No specific initialization needed
    }
    
    /**
     * Save dish attributes (vegetarian, chef special, gluten free, spicy)
     */
    public static function save_attributes($post_id, $section_id, $attributes) {
        // Validate inputs
        if (empty($post_id) || empty($section_id) || !is_array($attributes)) {
            return array(
                'success' => false,
                'message' => 'Invalid attribute data'
            );
        }
        
        // Save attributes as post meta
        $meta_key = 'efe_dish_attributes_' . $section_id;
        $attribute_data = array(
            'vegetarian' => isset($attributes['vegetarian']) ? (bool)$attributes['vegetarian'] : false,
            'chef_special' => isset($attributes['chef_special']) ? (bool)$attributes['chef_special'] : false,
            'gluten_free' => isset($attributes['gluten_free']) ? (bool)$attributes['gluten_free'] : false,
            'spicy' => isset($attributes['spicy']) ? (bool)$attributes['spicy'] : false
        );
        
        update_post_meta($post_id, $meta_key, $attribute_data);
        
        // Try to update icon visibility
        $updated_icons = self::update_icons_visibility($post_id, $section_id, $attribute_data);
        
        return array(
            'success' => true,
            'icons_updated' => $updated_icons
        );
    }
    
    /**
     * Get attributes for a dish section
     */
    public static function get_attributes($post_id, $section_id) {
        $meta_key = 'efe_dish_attributes_' . $section_id;
        $attributes = get_post_meta($post_id, $meta_key, true);
        
        // Set default values if not found
        if (!is_array($attributes)) {
            $attributes = array(
                'vegetarian' => false,
                'chef_special' => false,
                'gluten_free' => false,
                'spicy' => false
            );
        }
        
        return $attributes;
    }
    
    /**
     * Update icons visibility in Elementor data
     */
    private static function update_icons_visibility($post_id, $section_id, $attributes) {
        // Get Elementor document
        if (!class_exists('\Elementor\Plugin')) {
            return false;
        }
        
        $document = \Elementor\Plugin::$instance->documents->get($post_id);
        
        if (!$document) {
            return false;
        }
        
        $elementor_data = $document->get_elements_data();
        
        if (!$elementor_data) {
            return false;
        }
        
        // Find and update icons visibility in the section
        $updated = self::update_dish_icons_visibility($elementor_data, $section_id, $attributes);
        
        if (!$updated) {
            // Don't block saving if we don't find icons, still save the attributes
            return false;
        }
        
        // Update Elementor data
        $document->save(array(
            'elements' => $elementor_data
        ));
        
        return true;
    }
    
    /**
     * Update dish icons visibility based on selected attributes
     */
    private static function update_dish_icons_visibility(&$elements, $section_id, $attributes) {
        $found_section = false;
        $icons_updated = false;
        
        foreach ($elements as &$element) {
            // Case 1: Found the target section
            if (isset($element['id']) && $element['id'] === $section_id) {
                $found_section = true;
                
                // Look for icon widgets within this section
                if (isset($element['elements']) && is_array($element['elements'])) {
                    // For each column or inner container
                    foreach ($element['elements'] as &$child) {
                        if (isset($child['elements']) && is_array($child['elements'])) {
                            // For each widget inside
                            foreach ($child['elements'] as &$widget) {
                                // Check if it's an icon widget
                                if (isset($widget['widgetType']) && $widget['widgetType'] === 'icon') {
                                    // Identify which icon it is based on classes or other properties
                                    // This may vary depending on how icons were set up
                                    
                                    // Example: Use the class value to identify the icon
                                    $icon_class = isset($widget['settings']['icon']) ? $widget['settings']['icon'] : '';
                                    
                                    // Assume identification is done via ID or classes
                                    $is_hidden = false;
                                    
                                    if (strpos($icon_class, 'vegetarian') !== false || 
                                        isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'vegetarian') !== false) {
                                        $is_hidden = !$attributes['vegetarian'];
                                    }
                                    else if (strpos($icon_class, 'chef-special') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'chef-special') !== false) {
                                        $is_hidden = !$attributes['chef_special'];
                                    }
                                    else if (strpos($icon_class, 'gluten-free') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'gluten-free') !== false) {
                                        $is_hidden = !$attributes['gluten_free'];
                                    }
                                    else if (strpos($icon_class, 'spicy') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'spicy') !== false) {
                                        $is_hidden = !$attributes['spicy'];
                                    }
                                    
                                    // Set widget visibility property
                                    $widget['settings']['_cssClasses'] = $is_hidden ? 'efe-hidden-icon' : '';
                                    
                                    $icons_updated = true;
                                }
                            }
                        }
                    }
                }
                
                break; // Found and processed the section, exit the loop
            }
            
            // Case 2: Search recursively in children
            if (!$found_section && isset($element['elements']) && is_array($element['elements'])) {
                $result = self::update_dish_icons_visibility($element['elements'], $section_id, $attributes);
                if ($result) {
                    $icons_updated = true;
                }
            }
        }
        
        return $icons_updated;
    }
}
