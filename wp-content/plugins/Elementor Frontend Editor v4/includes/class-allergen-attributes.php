<?php
/**
 * Allergen Attributes Class
 * Handles allergen attributes functionality
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Allergen_Attributes {
    
    /**
     * Initialize allergen attributes handler
     */
    public function init() {
        // No specific initialization needed
    }
    
    /**
     * Save allergen attributes
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
        $meta_key = 'efe_allergen_attributes_' . $section_id;
        $attribute_data = array(
            'gluten' => isset($attributes['gluten']) ? (bool)$attributes['gluten'] : false,
            'crustaceans' => isset($attributes['crustaceans']) ? (bool)$attributes['crustaceans'] : false,
            'eggs' => isset($attributes['eggs']) ? (bool)$attributes['eggs'] : false,
            'fish' => isset($attributes['fish']) ? (bool)$attributes['fish'] : false,
            'peanuts' => isset($attributes['peanuts']) ? (bool)$attributes['peanuts'] : false,
            'soy' => isset($attributes['soy']) ? (bool)$attributes['soy'] : false,
            'milk' => isset($attributes['milk']) ? (bool)$attributes['milk'] : false,
            'nuts' => isset($attributes['nuts']) ? (bool)$attributes['nuts'] : false,
            'celery' => isset($attributes['celery']) ? (bool)$attributes['celery'] : false,
            'mustard' => isset($attributes['mustard']) ? (bool)$attributes['mustard'] : false,
            'sesame' => isset($attributes['sesame']) ? (bool)$attributes['sesame'] : false,
            'sulphites' => isset($attributes['sulphites']) ? (bool)$attributes['sulphites'] : false,
            'lupin' => isset($attributes['lupin']) ? (bool)$attributes['lupin'] : false,
            'molluscs' => isset($attributes['molluscs']) ? (bool)$attributes['molluscs'] : false
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
        $meta_key = 'efe_allergen_attributes_' . $section_id;
        $attributes = get_post_meta($post_id, $meta_key, true);
        
        // Set default values if not found
        if (!is_array($attributes)) {
            $attributes = array(
                'gluten' => false,
                'crustaceans' => false,
                'eggs' => false,
                'fish' => false,
                'peanuts' => false,
                'soy' => false,
                'milk' => false,
                'nuts' => false,
                'celery' => false,
                'mustard' => false,
                'sesame' => false,
                'sulphites' => false,
                'lupin' => false,
                'molluscs' => false
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
        $updated = self::update_allergen_icons_visibility($elementor_data, $section_id, $attributes);
        
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
     * Update allergen icons visibility based on selected attributes
     */
    private static function update_allergen_icons_visibility(&$elements, $section_id, $attributes) {
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
                                    $icon_class = isset($widget['settings']['icon']) ? $widget['settings']['icon'] : '';
                                    
                                    // Assume identification is done via ID or classes
                                    $is_hidden = false;
                                    
                                    if (strpos($icon_class, 'allergen-gluten') !== false || 
                                        isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-gluten') !== false) {
                                        $is_hidden = !$attributes['gluten'];
                                    }
                                    else if (strpos($icon_class, 'allergen-crustaceans') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-crustaceans') !== false) {
                                        $is_hidden = !$attributes['crustaceans'];
                                    }
                                    // Continue with similar conditions for all allergens
                                    else if (strpos($icon_class, 'allergen-eggs') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-eggs') !== false) {
                                        $is_hidden = !$attributes['eggs'];
                                    }
                                    else if (strpos($icon_class, 'allergen-fish') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-fish') !== false) {
                                        $is_hidden = !$attributes['fish'];
                                    }
                                    else if (strpos($icon_class, 'allergen-peanuts') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-peanuts') !== false) {
                                        $is_hidden = !$attributes['peanuts'];
                                    }
                                    else if (strpos($icon_class, 'allergen-soy') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-soy') !== false) {
                                        $is_hidden = !$attributes['soy'];
                                    }
                                    else if (strpos($icon_class, 'allergen-milk') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-milk') !== false) {
                                        $is_hidden = !$attributes['milk'];
                                    }
                                    else if (strpos($icon_class, 'allergen-nuts') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-nuts') !== false) {
                                        $is_hidden = !$attributes['nuts'];
                                    }
                                    else if (strpos($icon_class, 'allergen-celery') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-celery') !== false) {
                                        $is_hidden = !$attributes['celery'];
                                    }
                                    else if (strpos($icon_class, 'allergen-mustard') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-mustard') !== false) {
                                        $is_hidden = !$attributes['mustard'];
                                    }
                                    else if (strpos($icon_class, 'allergen-sesame') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-sesame') !== false) {
                                        $is_hidden = !$attributes['sesame'];
                                    }
                                    else if (strpos($icon_class, 'allergen-sulphites') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-sulphites') !== false) {
                                        $is_hidden = !$attributes['sulphites'];
                                    }
                                    else if (strpos($icon_class, 'allergen-lupin') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-lupin') !== false) {
                                        $is_hidden = !$attributes['lupin'];
                                    }
                                    else if (strpos($icon_class, 'allergen-molluscs') !== false || 
                                             isset($widget['settings']['_element_id']) && strpos($widget['settings']['_element_id'], 'allergen-molluscs') !== false) {
                                        $is_hidden = !$attributes['molluscs'];
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
                $result = self::update_allergen_icons_visibility($element['elements'], $section_id, $attributes);
                if ($result) {
                    $icons_updated = true;
                }
            }
        }
        
        return $icons_updated;
    }
}