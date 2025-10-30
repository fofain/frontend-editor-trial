<?php
/**
 * Section Handler Class
 * Handles operations on Elementor sections
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Section_Handler {
    
    /**
     * Initialize the section handler
     */
    public function init() {
        // Add attributes to Elementor sections and containers
        add_action('elementor/frontend/section/before_render', array($this, 'add_section_attributes'), 10, 1);
        add_action('elementor/frontend/column/before_render', array($this, 'add_column_attributes'), 10, 1);
        add_action('elementor/frontend/container/before_render', array($this, 'add_container_attributes'), 10, 1);
    }
    
    /**
     * Check if an element is duplicable
     */
    public function is_element_duplicable($element) {
        $settings = $element->get_settings_for_display();
        
        // Check 1: if element has CSS class 'duplicable'
        $has_duplicable_class = false;
        $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : '';
        if (!empty($css_classes) && strpos($css_classes, 'duplicable') !== false) {
            $has_duplicable_class = true;
        }
        
        // Check 2: if element has ID with 'duplicable'
        $has_duplicable_id = false;
        $css_id = isset($settings['_element_id']) ? $settings['_element_id'] : '';
        if (!empty($css_id) && strpos($css_id, 'duplicable') !== false) {
            $has_duplicable_id = true;
        }
        
        // Check 3: if element has custom HTML attributes
        $has_duplicable_attribute = false;
        if (isset($settings['_attributes']) && is_array($settings['_attributes'])) {
            foreach ($settings['_attributes'] as $attr) {
                if (isset($attr['key']) && $attr['key'] === 'data-duplicable' && isset($attr['value']) && $attr['value'] === 'true') {
                    $has_duplicable_attribute = true;
                    break;
                }
            }
        }
        
        // For backward compatibility, also consider "editable" if there's no "duplicable"
        $editable_handler = new EFE_Widget_Handler();
        $is_editable = $editable_handler->is_element_editable($element);
        
        return $has_duplicable_class || $has_duplicable_id || $has_duplicable_attribute || $is_editable;
    }

    /**
     * Check if an element is a category container
     */
    public function is_element_category($element) {
        $settings = $element->get_settings_for_display();
        
        // Check 1: if element has CSS class 'category'
        $has_category_class = false;
        $css_classes = isset($settings['_css_classes']) ? $settings['_css_classes'] : '';
        if (!empty($css_classes) && strpos($css_classes, 'category') !== false) {
            $has_category_class = true;
        }
        
        // Check 2: if element has ID with 'category'
        $has_category_id = false;
        $css_id = isset($settings['_element_id']) ? $settings['_element_id'] : '';
        if (!empty($css_id) && strpos($css_id, 'category') !== false) {
            $has_category_id = true;
        }
        
        // Check 3: if element has custom HTML attributes
        $has_category_attribute = false;
        if (isset($settings['_attributes']) && is_array($settings['_attributes'])) {
            foreach ($settings['_attributes'] as $attr) {
                if (isset($attr['key']) && $attr['key'] === 'data-category' && isset($attr['value']) && $attr['value'] === 'true') {
                    $has_category_attribute = true;
                    break;
                }
            }
        }
        
        return $has_category_class || $has_category_id || $has_category_attribute;
    }
    
    /**
     * Add attributes to Elementor containers
     */
    public function add_container_attributes($container) {
        // Check permissions
        if (!current_user_can('edit_posts')) {
            return;
        }
        
        $container_id = $container->get_id();
        
        // Check if container is labeled as a "category"
        if ($this->is_element_category($container)) {
            $container->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section efe-category-section',
                'data-section-id' => $container_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'container',
                'data-is-category' => 'true'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $container->add_render_attribute('_wrapper', 'data-efe-category', 'true');
        }
        // Check if container is labeled as "duplicable"
        else if ($this->is_element_duplicable($container)) {
            $container->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section',
                'data-section-id' => $container_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'container'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $container->add_render_attribute('_wrapper', 'data-efe-duplicable', 'true');
        }
    }
    
    /**
     * Add attributes to Elementor sections
     */
    public function add_section_attributes($section) {
        // Check permissions
        if (!current_user_can('edit_posts')) {
            return;
        }
        
        $section_id = $section->get_id();
        
        // Check if section is labeled as a "category"
        if ($this->is_element_category($section)) {
            $section->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section efe-category-section',
                'data-section-id' => $section_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'section',
                'data-is-category' => 'true'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $section->add_render_attribute('_wrapper', 'data-efe-category', 'true');
        }
        // Check if section is labeled as "duplicable"
        else if ($this->is_element_duplicable($section)) {
            $section->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section',
                'data-section-id' => $section_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'section'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $section->add_render_attribute('_wrapper', 'data-efe-duplicable', 'true');
        }
    }
    
    /**
     * Add attributes to Elementor columns
     */
    public function add_column_attributes($column) {
        // Check permissions
        if (!current_user_can('edit_posts')) {
            return;
        }
        
        $column_id = $column->get_id();
        
        // Check if column is labeled as a "category"
        if ($this->is_element_category($column)) {
            $column->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section efe-category-section',
                'data-section-id' => $column_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'column',
                'data-is-category' => 'true'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $column->add_render_attribute('_wrapper', 'data-efe-category', 'true');
        }
        // Check if column is labeled as "duplicable"
        else if ($this->is_element_duplicable($column)) {
            $column->add_render_attribute('_wrapper', [
                'class' => 'efe-editable-section',
                'data-section-id' => $column_id,
                'data-post-id' => get_the_ID(),
                'data-element-type' => 'column'
            ]);
            
            // Debug: Add visible attribute in front-end for verification
            $column->add_render_attribute('_wrapper', 'data-efe-duplicable', 'true');
        }
    }
    
    /**
     * Find and delete a section in Elementor data
     */
    public static function find_and_delete_section(&$elements, $section_id, $parent_category = '', $parent_key = null) {
        foreach ($elements as $key => &$element) {
            // Case 1: Found the section to delete
            if (isset($element['id']) && $element['id'] === $section_id) {
                // Check if this is a category section (should not delete via this method)
                if (isset($element['settings']['_css_classes']) && 
                    strpos($element['settings']['_css_classes'], 'category') !== false) {
                    return false;
                }
                
                // Remove this section from its parent array
                if ($parent_key !== null) {
                    unset($elements[$key]);
                    $elements = array_values($elements); // Re-index array
                } else {
                    // If there's no parent_key, we're at the top level
                    unset($elements[$key]);
                    $elements = array_values($elements); // Re-index array
                }
                return true;
            }
            
            // Case 2: Current element has child elements
            if (isset($element['elements']) && is_array($element['elements'])) {
                // If this is the parent category we're looking for, search its children
                if (!empty($parent_category) && isset($element['id']) && $element['id'] === $parent_category) {
                    if (self::find_and_delete_section($element['elements'], $section_id, '', $key)) {
                        return true;
                    }
                } else {
                    // Search recursively among child elements
                    if (self::find_and_delete_section($element['elements'], $section_id, $parent_category, $key)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Find and duplicate a section in Elementor data
     * Returns: [ 'success' => true, 'new_section_id' => ..., 'id_map' => [old_id => new_id, ...] ]
     */
    public static function find_and_duplicate_section(&$elements, $section_id, $parent_category = '', $is_category = false) {
        // If parent category is specified, look for it first
        if (!empty($parent_category) && !$is_category) {
            foreach ($elements as $key => &$element) {
                if (isset($element['id']) && $element['id'] === $parent_category) {
                    // Found the parent category, now find the section within it
                    $result = self::find_and_duplicate_section_within_parent($element['elements'], $section_id);
                    if (isset($result['success']) && $result['success']) {
                        return $result;
                    }
                    break;
                }
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $result = self::find_and_duplicate_section($element['elements'], $section_id, $parent_category);
                    if (isset($result['success']) && $result['success']) {
                        return $result;
                    }
                }
            }
            return array(
                'success' => false,
                'message' => 'Parent category or section not found'
            );
        }
        // --- PATCH: If duplicating a category, use plate creation logic for each duplicable child ---
        foreach ($elements as $key => &$element) {
            if (isset($element['id']) && $element['id'] === $section_id) {
                // Check if this is a category (top-level section with children)
                $is_category_section = isset($element['settings']['_css_classes']) && strpos($element['settings']['_css_classes'], 'category') !== false;
                if ($is_category_section && isset($element['elements']) && is_array($element['elements'])) {
                    // Deep clone the category section itself (without children)
                    $id_map = array();
                    $new_category = json_decode(json_encode($element), true);
                    $new_category['id'] = uniqid();
                    $id_map[$element['id']] = $new_category['id'];
                    $new_category['elements'] = array();
                    // For each child, if duplicable, clone using plate logic
                    foreach ($element['elements'] as $child_element) {
                        if (isset($child_element['settings']['_css_classes']) && strpos($child_element['settings']['_css_classes'], 'duplicable') !== false) {
                            // Clone as a new plate, preserving settings
                            $new_plate = json_decode(json_encode($child_element), true);
                            $new_plate['id'] = uniqid();
                            // Regenerate IDs for all children
                            if (isset($new_plate['elements']) && is_array($new_plate['elements'])) {
                                foreach ($new_plate['elements'] as &$plate_child) {
                                    $plate_child['id'] = uniqid();
                                    if (isset($plate_child['elements']) && is_array($plate_child['elements'])) {
                                        foreach ($plate_child['elements'] as &$widget) {
                                            $widget['id'] = uniqid();
                                        }
                                    }
                                }
                            }
                            $new_category['elements'][] = $new_plate;
                            $id_map[$child_element['id']] = $new_plate['id'];
                        } else {
                            // Non-duplicable child: deep clone as is
                            $new_child = json_decode(json_encode($child_element), true);
                            $new_child['id'] = uniqid();
                            $new_category['elements'][] = $new_child;
                            $id_map[$child_element['id']] = $new_child['id'];
                        }
                    }
                    // Add new category after the original
                    array_splice($elements, $key + 1, 0, array($new_category));
                    // Log the id_map
            
                    return array(
                        'success' => true,
                        'new_section_id' => $new_category['id'],
                        'id_map' => $id_map
                    );
                } else {
                    // Not a category, fallback to old logic
                    $id_map = array();
                    $new_section = self::deep_clone_with_id_map($element, $id_map);
                    array_splice($elements, $key + 1, 0, array($new_section));
                    return array(
                        'success' => true,
                        'new_section_id' => $new_section['id'],
                        'id_map' => $id_map
                    );
                }
            }
            if (isset($element['elements']) && is_array($element['elements'])) {
                $result = self::find_and_duplicate_section($element['elements'], $section_id);
                if (isset($result['success']) && $result['success']) {
                    return $result;
                }
            }
        }
        return array(
            'success' => false,
            'message' => 'Section not found'
        );
    }

    /**
     * Deep clone an element and build an ID map of old => new IDs
     */
    private static function deep_clone_with_id_map($element, &$id_map) {
        $new_element = json_decode(json_encode($element), true); // Deep clone
        $old_id = isset($element['id']) ? $element['id'] : null;
        $new_id = self::regenerate_element_ids($new_element);
        if ($old_id && $new_id) {
            $id_map[$old_id] = $new_id;
        }
        // Recursively process children
        if (isset($element['elements']) && is_array($element['elements'])) {
            foreach ($element['elements'] as $i => $child) {
                if (isset($new_element['elements'][$i])) {
                    self::deep_clone_with_id_map_recursive($child, $new_element['elements'][$i], $id_map);
                }
            }
        }
        return $new_element;
    }
    private static function deep_clone_with_id_map_recursive($orig, &$copy, &$id_map) {
        $old_id = isset($orig['id']) ? $orig['id'] : null;
        $new_id = self::regenerate_element_ids($copy);
        if ($old_id && $new_id) {
            $id_map[$old_id] = $new_id;
        }
        if (isset($orig['elements']) && is_array($orig['elements'])) {
            foreach ($orig['elements'] as $i => $child) {
                if (isset($copy['elements'][$i])) {
                    self::deep_clone_with_id_map_recursive($child, $copy['elements'][$i], $id_map);
                }
            }
        }
    }
    
    /**
     * Helper to duplicate a section within a parent
     */
    private static function find_and_duplicate_section_within_parent(&$elements, $section_id) {
        foreach ($elements as $key => &$element) {
            // Check if this is the section we're looking for
            if (isset($element['id']) && $element['id'] === $section_id) {
                // Duplicate the section keeping all original content
                $new_section = json_decode(json_encode($element), true); // Deep clone
                
                // Generate new IDs for the section and all its children
                self::regenerate_element_ids($new_section);
                
                // Add new section after the original one
                array_splice($elements, $key + 1, 0, array($new_section));
                
                return array(
                    'success' => true,
                    'new_section_id' => $new_section['id']
                );
            }
            
            // Check nested elements
            if (isset($element['elements']) && is_array($element['elements'])) {
                $result = self::find_and_duplicate_section_within_parent($element['elements'], $section_id);
                if (isset($result['success']) && $result['success']) {
                    return $result;
                }
            }
        }
        
        return array(
            'success' => false,
            'message' => 'Section not found in parent category'
        );
    }
    
    /**
     * Find and move a section in Elementor data
     */
    public static function find_and_move_section(&$elements, $section_id, $direction) {
        // Case 1: Section at top level
        foreach ($elements as $key => $element) {
            if (isset($element['id']) && $element['id'] === $section_id) {
                // Determine new position
                $new_pos = ($direction === 'up') ? $key - 1 : $key + 1;
                
                // Check if new position is valid
                if ($new_pos < 0 || $new_pos >= count($elements)) {
                    return array(
                        'success' => false,
                        'message' => 'Cannot move section any further in this direction'
                    );
                }
                
                // Swap elements
                $temp = $elements[$key];
                $elements[$key] = $elements[$new_pos];
                $elements[$new_pos] = $temp;
                
                return array(
                    'success' => true
                );
            }
        }
        
        // Case 2: Search recursively in nested sections
        foreach ($elements as $key => &$element) {
            if (isset($element['elements']) && is_array($element['elements'])) {
                $result = self::find_and_move_section($element['elements'], $section_id, $direction);
                if (isset($result['success']) && $result['success']) {
                    return $result;
                }
            }
        }
        
        return array(
            'success' => false,
            'message' => 'Section not found'
        );
    }
    
    /**
     * Find and move a section in Elementor data respecting hierarchy
     */
    public static function find_and_move_section_hierarchical(&$elements, $section_id, $direction, $is_category = false, $parent_category = '') {
        // Handle category sections
        if ($is_category) {
            // Categories can only be moved at top level
            foreach ($elements as $key => $element) {
                if (isset($element['id']) && $element['id'] === $section_id) {
                    // Determine new position
                    $new_pos = ($direction === 'up') ? $key - 1 : $key + 1;
                    
                    // Check if new position is valid
                    if ($new_pos < 0 || $new_pos >= count($elements)) {
                        return array(
                            'success' => false,
                            'message' => 'Cannot move category any further in this direction'
                        );
                    }
                    
                    // Swap elements
                    $temp = $elements[$key];
                    $elements[$key] = $elements[$new_pos];
                    $elements[$new_pos] = $temp;
                    
                    return array('success' => true);
                }
            }
            
            // If not found at top level, search in child elements
            foreach ($elements as &$element) {
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $result = self::find_and_move_section_hierarchical($element['elements'], $section_id, $direction, $is_category, $parent_category);
                    if ($result['success']) {
                        return $result;
                    }
                }
            }
        } 
        // Handle regular sections with parent category
        else if (!empty($parent_category)) {
            // Find the parent category first
            foreach ($elements as $key => &$element) {
                if (isset($element['id']) && $element['id'] === $parent_category) {
                    // Now find and move the child section within this category
                    if (isset($element['elements']) && is_array($element['elements'])) {
                        // Case 1: Direct children of category
                        foreach ($element['elements'] as $childKey => $childElement) {
                            if (isset($childElement['id']) && $childElement['id'] === $section_id) {
                                // Found the direct child section
                                $new_pos = ($direction === 'up') ? $childKey - 1 : $childKey + 1;
                                
                                // Check if new position is valid
                                if ($new_pos < 0 || $new_pos >= count($element['elements'])) {
                                    return array(
                                        'success' => false,
                                        'message' => 'Cannot move section any further within this category'
                                    );
                                }
                                
                                // Swap elements
                                $temp = $element['elements'][$childKey];
                                $element['elements'][$childKey] = $element['elements'][$new_pos];
                                $element['elements'][$new_pos] = $temp;
                                
                                return array('success' => true);
                            }
                            
                            // Case 2: Check for sections in columns or containers
                            if (isset($childElement['elements']) && is_array($childElement['elements'])) {
                                // For each column/inner container
                                foreach ($childElement['elements'] as $sectionKey => $sectionElement) {
                                    if (isset($sectionElement['id']) && $sectionElement['id'] === $section_id) {
                                        // Found the section in a column/container
                                        $new_pos = ($direction === 'up') ? $sectionKey - 1 : $sectionKey + 1;
                                        
                                        // Check if new position is valid
                                        if ($new_pos < 0 || $new_pos >= count($childElement['elements'])) {
                                            return array(
                                                'success' => false,
                                                'message' => 'Cannot move section any further within this column'
                                            );
                                        }
                                        
                                        // Swap elements
                                        $temp = $childElement['elements'][$sectionKey];
                                        $childElement['elements'][$sectionKey] = $childElement['elements'][$new_pos];
                                        $childElement['elements'][$new_pos] = $temp;
                                        
                                        return array('success' => true);
                                    }
                                    
                                    // Deep search if needed
                                    if (isset($sectionElement['elements']) && is_array($sectionElement['elements'])) {
                                        $result = self::find_and_move_section($sectionElement['elements'], $section_id, $direction);
                                        if (isset($result['success']) && $result['success']) {
                                            return $result;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    return array(
                        'success' => false,
                        'message' => 'Section not found within its parent category'
                    );
                }
                
                // Continue search in other elements
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $result = self::find_and_move_section_hierarchical($element['elements'], $section_id, $direction, $is_category, $parent_category);
                    if (isset($result['success']) && $result['success']) {
                        return $result;
                    }
                }
            }
        }
        
        // Fall back to the original method for backward compatibility
        return self::find_and_move_section($elements, $section_id, $direction);
    }
    
    /**
     * Regenerate unique IDs for an element and all its children
     */
    private static function regenerate_element_ids(&$element) {
        // Generate new unique ID for this element
        $element['id'] = uniqid();
        
        // If this element has children, regenerate their IDs too
        if (isset($element['elements']) && is_array($element['elements'])) {
            foreach ($element['elements'] as &$child) {
                self::regenerate_element_ids($child);
            }
        }
        return $element['id']; // Return the new ID
    }

    /**
     * Create a new blank dish section
     * 
     * @param array $elements The Elementor elements array
     * @param string $parent_category_id The ID of the parent category
     * @return array Result with success flag and new section ID
     */
    public static function create_new_blank_dish(&$elements, $parent_category_id) {
        // Find the parent category and get its structure
        $category_element = null;
        $template_section = null;
        
        // Helper function to find the parent category
        $find_category = function(&$elements) use (&$find_category, $parent_category_id, &$category_element) {
            foreach ($elements as &$element) {
                if (isset($element['id']) && $element['id'] === $parent_category_id) {
                    $category_element = &$element;
                    return true;
                }
                
                // Check children
                if (isset($element['elements']) && is_array($element['elements'])) {
                    if ($find_category($element['elements'])) {
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        // Find the parent category
        $find_category($elements);
        
        if (!$category_element) {
            return array(
                'success' => false,
                'message' => 'Parent category not found'
            );
        }
        
        // Find a template section within the category
        $find_template = function(&$elements) use (&$find_template, &$template_section) {
            foreach ($elements as &$element) {
                // Look for sections that are not categories themselves
                if (isset($element['elType']) && $element['elType'] === 'section') {
                    $css_classes = isset($element['settings']['_css_classes']) ? $element['settings']['_css_classes'] : '';
                    
                    // Skip if this is a category section
                    if (strpos($css_classes, 'category') !== false) {
                        continue;
                    }
                    
                    // This could be our template
                    if (!$template_section) {
                        $template_section = $element;
                    }
                }
                
                // Check children
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $find_template($element['elements']);
                }
            }
        };
        
        // Find template within the category
        if (isset($category_element['elements'])) {
            $find_template($category_element['elements']);
        }
        
        // If no template found, create a basic structure
        if (!$template_section) {
            return self::create_basic_dish_structure($category_element);
        }
        
        // Clone the template section
        $new_section = json_decode(json_encode($template_section), true);
        
        // Generate new IDs for the section and all its children
        self::regenerate_element_ids($new_section);
        
        // Clear content and set placeholder content
        self::reset_section_content($new_section);
        
        // Insert the new section into the category
        if (!isset($category_element['elements'])) {
            $category_element['elements'] = array();
        }
        
        // Add the new section to the category
        $category_element['elements'][] = $new_section;
        
        // Ensure the new section has the correct structure for Elementor
        $new_section['elType'] = 'section';
        $new_section['settings']['_css_classes'] = 'duplicable'; // Mark as duplicable
        
        error_log("EFE: Created new blank dish with ID: " . $new_section['id']);
        error_log("EFE: Category now has " . count($category_element['elements']) . " elements");
        error_log("EFE: New section structure: " . json_encode($new_section));
        
        return array(
            'success' => true,
            'new_section_id' => $new_section['id']
        );
    }
    
    /**
     * Create a basic dish structure when no template is available
     */
    private static function create_basic_dish_structure(&$category_element) {
        // Create a basic section structure
        $new_section = array(
            'id' => uniqid('section-'),
            'elType' => 'section',
            'settings' => array(
                '_margin' => array('unit' => 'px', 'top' => '10', 'right' => '0', 'bottom' => '10', 'left' => '0'),
                '_padding' => array('unit' => 'px', 'top' => '15', 'right' => '15', 'bottom' => '15', 'left' => '15'),
                '_background_background' => 'classic',
                '_background_color' => '#ffffff',
                '_border_radius' => array('unit' => 'px', 'top' => '8', 'right' => '8', 'bottom' => '8', 'left' => '8'),
                '_box_shadow_box_shadow_type' => 'yes',
                '_box_shadow_box_shadow' => array(
                    'horizontal' => 0,
                    'vertical' => 2,
                    'blur' => 8,
                    'spread' => 0,
                    'color' => 'rgba(0,0,0,0.1)'
                )
            ),
            'elements' => array()
        );
        
        // Create a column
        $new_column = array(
            'id' => uniqid('column-'),
            'elType' => 'column',
            'settings' => array(
                '_column_size' => 100,
                '_inline_size' => null
            ),
            'elements' => array()
        );
        
        // Create default widgets
        $widgets = array(
            array(
                'id' => uniqid('widget-'),
                'elType' => 'widget',
                'widgetType' => 'heading',
                'settings' => array(
                    'title' => 'Scrivi il titolo qui...',
                    '_margin' => array('unit' => 'px', 'top' => '0', 'right' => '0', 'bottom' => '10', 'left' => '0'),
                    'title_color' => '#333333',
                    'typography_typography' => 'custom',
                    'typography_font_size' => array('unit' => 'px', 'size' => 24)
                )
            ),
            array(
                'id' => uniqid('widget-'),
                'elType' => 'widget',
                'widgetType' => 'text-editor',
                'settings' => array(
                    'editor' => '<p>Scrivi il testo qui...</p>',
                    '_margin' => array('unit' => 'px', 'top' => '0', 'right' => '0', 'bottom' => '15', 'left' => '0'),
                    'text_color' => '#666666'
                )
            ),
            array(
                'id' => uniqid('widget-'),
                'elType' => 'widget',
                'widgetType' => 'heading',
                'settings' => array(
                    'title' => '0€',
                    '_css_classes' => 'price-heading',
                    '_margin' => array('unit' => 'px', 'top' => '0', 'right' => '0', 'bottom' => '0', 'left' => '0'),
                    'title_color' => '#4CAF50',
                    'typography_typography' => 'custom',
                    'typography_font_size' => array('unit' => 'px', 'size' => 20),
                    'efe_price_value' => '0',
                    'efe_currency' => '€',
                    'efe_currency_position' => 'after',
                    'efe_show_currency' => true
                )
            )
        );
        
        // Add widgets to column
        foreach ($widgets as $widget) {
            $new_column['elements'][] = $widget;
        }
        
        // Add column to section
        $new_section['elements'][] = $new_column;
        
        // Add section to category
        if (!isset($category_element['elements'])) {
            $category_element['elements'] = array();
        }
        $category_element['elements'][] = $new_section;
        
        return array(
            'success' => true,
            'new_section_id' => $new_section['id']
        );
    }
    
    /**
     * Reset section content to placeholder values
     */
    private static function reset_section_content(&$section) {
        if (!isset($section['elements']) || !is_array($section['elements'])) {
            return;
        }
        
        foreach ($section['elements'] as &$element) {
            if (isset($element['widgetType'])) {
                // This is a widget
                $widget_type = $element['widgetType'];
                
                switch ($widget_type) {
                    case 'heading':
                        $element['settings']['title'] = 'Scrivi il titolo qui...';
                        
                        // Check if this is a price heading
                        if (isset($element['settings']['_css_classes']) && 
                            (strpos($element['settings']['_css_classes'], 'price') !== false || 
                             strpos($element['settings']['_css_classes'], 'editable-price') !== false)) {
                            
                            $element['settings']['title'] = '0€';
                            $element['settings']['efe_price_value'] = '0';
                            $element['settings']['efe_currency'] = '€';
                            $element['settings']['efe_currency_position'] = 'after';
                            $element['settings']['efe_show_currency'] = true;
                        } else {
                            // For regular headings, reset to default
                            $element['settings']['title'] = 'Scrivi il titolo qui...';
                        }
                        break;
                        
                    case 'text-editor':
                        $element['settings']['editor'] = '<p>Scrivi il testo qui...</p>';
                        break;
                        
                    case 'image':
                        if (isset($element['settings']['image'])) {
                            $element['settings']['image'] = array(
                                'url' => '/wp-content/plugins/elementor/assets/images/placeholder.png',
                                'id' => ''
                            );
                        }
                        break;
                        
                    case 'price-table':
                    case 'price-list':
                        if (isset($element['settings']['price'])) {
                            $element['settings']['price'] = '0';
                        }
                        break;
                }
            } else if (isset($element['elements']) && is_array($element['elements'])) {
                // This is a container (column, section, etc.), recurse
                self::reset_section_content($element);
            }
        }
    }
}