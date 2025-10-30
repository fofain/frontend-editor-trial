<?php
/**
 * AJAX Handler Class
 * Handles all AJAX requests for the editor
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_AJAX_Handler {
    
    /**
     * Initialize the AJAX handler
     */
    public function init() {
        // Register AJAX endpoints
        add_action('wp_ajax_save_elementor_content', array($this, 'save_elementor_content'));
        add_action('wp_ajax_delete_elementor_section', array($this, 'delete_elementor_section'));
        add_action('wp_ajax_duplicate_elementor_section', array($this, 'duplicate_elementor_section'));
        add_action('wp_ajax_move_elementor_section', array($this, 'move_elementor_section'));
        add_action('wp_ajax_save_dish_attributes', array($this, 'save_dish_attributes'));
        add_action('wp_ajax_save_allergen_attributes', array($this, 'save_allergen_attributes'));
        add_action('wp_ajax_save_global_currency_settings', array($this, 'save_global_currency_settings'));
        add_action('wp_ajax_batch_save_elementor_content', array($this, 'batch_save_elementor_content'));
    }
    
    /**
     * Verify AJAX request
     */
    private function verify_request() {
        // Security check
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'elementor_frontend_editor_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
            return false;
        }

        // Permission check - modified to allow contributors
        if (!current_user_can('edit_posts') && !current_user_can('edit_published_posts')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
            return false;
        }

        return true;
    }
    
    /**
     * Get Elementor document and data
     */
    private function get_elementor_document($post_id) {
        if (!class_exists('\Elementor\Plugin')) {
            wp_send_json_error(array('message' => 'Elementor not available'));
            return null;
        }
        
        $document = \Elementor\Plugin::$instance->documents->get($post_id);
        
        if (!$document) {
            wp_send_json_error(array('message' => 'Elementor document not found'));
            return null;
        }
        
        return $document;
    }
    
    /**
     * Save Elementor content (widgets)
     */
    public function save_elementor_content() {
        if (!$this->verify_request()) {
            return;
        }
        
        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $widget_id = isset($_POST['widget_id']) ? sanitize_text_field($_POST['widget_id']) : '';
        $widget_type = isset($_POST['widget_type']) ? sanitize_text_field($_POST['widget_type']) : '';
        
        if (empty($post_id) || empty($widget_id) || empty($widget_type)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }
        
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return;
        }
        
        $elementor_data = $document->get_elements_data();
        
        if (!$elementor_data) {
            wp_send_json_error(array('message' => 'Elementor data not found'));
            return;
        }
        
        // Update the widget with EFE_Widget_Handler
        $updated = EFE_Widget_Handler::find_and_update_widget($elementor_data, $widget_id, $widget_type, $_POST);
        
        if (!$updated) {
            wp_send_json_error(array('message' => 'Widget not found in Elementor data'));
            return;
        }
        
        $save_result = $document->save(array(
            'elements' => $elementor_data
        ));
        
        if (is_wp_error($save_result)) {
            wp_send_json_error(array('message' => 'Error saving: ' . $save_result->get_error_message()));
            return;
        }
        
        // Backup in meta, useful for security or debugging
        update_post_meta($post_id, '_elementor_data', wp_slash(json_encode($elementor_data)));
        
        wp_send_json_success(array('message' => 'Content updated successfully'));
    }
    
    /**
     * Delete an Elementor section
     */
    public function delete_elementor_section() {
        if (!$this->verify_request()) {
            return;
        }
        
        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $section_id = isset($_POST['section_id']) ? sanitize_text_field($_POST['section_id']) : '';
        
        if (empty($post_id) || empty($section_id)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }
        
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return;
        }
        
        $elementor_data = $document->get_elements_data();
        
        if (!$elementor_data) {
            wp_send_json_error(array('message' => 'Elementor data not found'));
            return;
        }
        
        // Delete the section with EFE_Section_Handler
        $deleted = EFE_Section_Handler::find_and_delete_section($elementor_data, $section_id);
        
        if (!$deleted) {
            wp_send_json_error(array('message' => 'Section not found in Elementor data'));
            return;
        }
        
        // Update Elementor data
        $document->save(array(
            'elements' => $elementor_data
        ));
        
        wp_send_json_success(array('message' => 'Section deleted successfully'));
    }
    
    /**
     * Duplicate an Elementor section
     */
    public function duplicate_elementor_section() {
        if (!$this->verify_request()) {
            return;
        }
        
        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $section_id = isset($_POST['section_id']) ? sanitize_text_field($_POST['section_id']) : '';
        
        if (empty($post_id) || empty($section_id)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }
        
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return;
        }
        
        $elementor_data = $document->get_elements_data();
        
        if (!$elementor_data) {
            wp_send_json_error(array('message' => 'Elementor data not found'));
            return;
        }
        
        // Duplicate the section with EFE_Section_Handler
        $result = EFE_Section_Handler::find_and_duplicate_section($elementor_data, $section_id);
        
        if (!$result['success']) {
            wp_send_json_error(array('message' => $result['message']));
            return;
        }
        
        // --- Find all duplicable IDs in the original structure ---
        if (!function_exists('find_duplicable_ids')) {
            function find_duplicable_ids($elements) {
                $ids = array();
                foreach ($elements as $el) {
                    $css_classes = isset($el['settings']['_css_classes']) ? $el['settings']['_css_classes'] : '';
                    $element_id = isset($el['settings']['_element_id']) ? $el['settings']['_element_id'] : '';
                    if ((strpos($css_classes, 'duplicable') !== false) || ($element_id === 'duplicable')) {
                        $ids[] = $el['id'];
                    }
                    if (isset($el['elements']) && is_array($el['elements'])) {
                        $ids = array_merge($ids, find_duplicable_ids($el['elements']));
                    }
                }
                return $ids;
            }
        }
        $duplicable_ids = find_duplicable_ids($elementor_data);
        // --- END ---
        
        if (!empty($result['id_map']) && is_array($result['id_map'])) {
            foreach ($result['id_map'] as $old_id => $new_id) {
                if (in_array($old_id, $duplicable_ids)) {
                    $this->copy_section_attributes($post_id, $old_id, $new_id);
                }
            }
        }
        
        // Update Elementor data
        $document->save(array(
            'elements' => $elementor_data
        ));
        
        wp_send_json_success(array(
            'message' => 'New section added successfully',
            'new_section_id' => $result['new_section_id']
        ));
    }
    
    /**
     * Move a section up or down
     */
    public function move_elementor_section() {
        if (!$this->verify_request()) {
            return;
        }

        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $section_id = isset($_POST['section_id']) ? sanitize_text_field($_POST['section_id']) : '';
        $direction = isset($_POST['direction']) ? sanitize_text_field($_POST['direction']) : '';
        $is_category = isset($_POST['is_category']) ? filter_var($_POST['is_category'], FILTER_VALIDATE_BOOLEAN) : false;
        $parent_category = isset($_POST['parent_category']) ? sanitize_text_field($_POST['parent_category']) : '';

        if (empty($post_id) || empty($section_id) || empty($direction) || !in_array($direction, array('up', 'down'))) {
            wp_send_json_error(array('message' => 'Incomplete or invalid data'));
            return;
        }

        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return;
        }

        $elementor_data = $document->get_elements_data();

        if (!$elementor_data) {
            wp_send_json_error(array('message' => 'Elementor data not found'));
            return;
        }

        // Move the section with EFE_Section_Handler
        $result = EFE_Section_Handler::find_and_move_section_hierarchical($elementor_data, $section_id, $direction, $is_category, $parent_category);

        if (!$result['success']) {
            wp_send_json_error(array('message' => $result['message']));
            return;
        }

        // Update Elementor data
        $document->save(array(
            'elements' => $elementor_data
        ));

        wp_send_json_success(array(
            'message' => 'Sezione spostata con successo'
        ));
    }
    
    /**
     * Save dish attributes
     */
    public function save_dish_attributes() {
        if (!$this->verify_request()) {
            return;
        }
        
        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $section_id = isset($_POST['section_id']) ? sanitize_text_field($_POST['section_id']) : '';
        
        if (empty($post_id) || empty($section_id)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }
        
        // Get attribute values
        $vegetarian = isset($_POST['vegetarian']) ? (bool)$_POST['vegetarian'] : false;
        $chef_special = isset($_POST['chef_special']) ? (bool)$_POST['chef_special'] : false;
        $gluten_free = isset($_POST['gluten_free']) ? (bool)$_POST['gluten_free'] : false;
        $spicy = isset($_POST['spicy']) ? (bool)$_POST['spicy'] : false;
        
        // Save attributes with EFE_Dish_Attributes
        $result = EFE_Dish_Attributes::save_attributes($post_id, $section_id, array(
            'vegetarian' => $vegetarian,
            'chef_special' => $chef_special,
            'gluten_free' => $gluten_free,
            'spicy' => $spicy
        ));
        
        if (!$result['success']) {
            wp_send_json_error(array('message' => $result['message']));
            return;
        }
        
        wp_send_json_success(array('message' => 'Dish attributes updated successfully'));
    }
    
    /**
     * Save allergen attributes
     */
    public function save_allergen_attributes() {
        if (!$this->verify_request()) {
            return;
        }

        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $section_id = isset($_POST['section_id']) ? sanitize_text_field($_POST['section_id']) : '';

        if (empty($post_id) || empty($section_id)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }

        // Get allergen values
        $allergen_data = array();

        // Process all allergens
        $allergens = array(
            'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
            'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
        );

        foreach ($allergens as $allergen) {
            $allergen_data[$allergen] = isset($_POST[$allergen]) ? (bool)$_POST[$allergen] : false;
        }

        // Save attributes with EFE_Allergen_Attributes
        $result = EFE_Allergen_Attributes::save_attributes($post_id, $section_id, $allergen_data);

        if (!$result['success']) {
            wp_send_json_error(array('message' => $result['message']));
            return;
        }

        wp_send_json_success(array('message' => 'Allergen attributes updated successfully'));
    }
    
    /**
     * Save global currency settings and apply to all price headings
     */
    public function save_global_currency_settings() {
        if (!$this->verify_request()) {
            return;
        }
        
        // Get data
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $currency = isset($_POST['currency']) ? sanitize_text_field($_POST['currency']) : '€';
        $currency_position = isset($_POST['currency_position']) ? sanitize_text_field($_POST['currency_position']) : 'before';
        $show_currency = isset($_POST['show_currency']) ? (bool)$_POST['show_currency'] : true;
        
        if (empty($post_id)) {
            wp_send_json_error(array('message' => 'Incomplete data'));
            return;
        }
        
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return;
        }
        
        $elementor_data = $document->get_elements_data();
        
        if (!$elementor_data) {
            wp_send_json_error(array('message' => 'Elementor data not found'));
            return;
        }
        
        // Update all price headings with new currency settings
        $updated_count = $this->update_all_price_headings($elementor_data, $currency, $currency_position, $show_currency);
        
        // Save the updated elements data
        $document->save(array(
            'elements' => $elementor_data
        ));
        
        // Save global currency settings as post meta for future reference
        update_post_meta($post_id, 'efe_global_currency', $currency);
        update_post_meta($post_id, 'efe_global_currency_position', $currency_position);
        update_post_meta($post_id, 'efe_global_show_currency', $show_currency);
        
        wp_send_json_success(array(
            'message' => 'Global currency settings applied successfully',
            'updated_count' => $updated_count,
            'currency' => $currency,
            'currency_position' => $currency_position,
            'show_currency' => $show_currency
        ));
    }
    
    /**
     * Batch save multiple elementor content changes
     */
    public function batch_save_elementor_content() {
        if (!$this->verify_request()) {
            return;
        }

        // Get data
        $changes_json = isset($_POST['changes']) ? stripslashes($_POST['changes']) : '';

        if (empty($changes_json)) {
            wp_send_json_error(array('message' => 'No changes data provided'));
            return;
        }

        // Decode JSON
        $changes = json_decode($changes_json, true);

        if (!is_array($changes)) {
            wp_send_json_error(array('message' => 'Invalid changes data format'));
            return;
        }

        $results = array(
            'widgets' => array(),
            'attributes' => array(),
            'removals' => array(),
            'duplications' => array(),
            'movements' => array()
        );

        // Process duplications first
        if (!empty($changes['duplications']) && is_array($changes['duplications'])) {
            // Group duplications by operation ID
            $duplication_operations = array();

            foreach ($changes['duplications'] as $duplication_data) {
                $post_id = isset($duplication_data['postId']) ? intval($duplication_data['postId']) : 0;
                $section_id = isset($duplication_data['sectionId']) ? sanitize_text_field($duplication_data['sectionId']) : '';
                $parent_category = isset($duplication_data['parentCategory']) ? sanitize_text_field($duplication_data['parentCategory']) : '';
                $is_category = isset($duplication_data['isCategory']) ? filter_var($duplication_data['isCategory'], FILTER_VALIDATE_BOOLEAN) : false;
                $operation_id = isset($duplication_data['operationId']) ? sanitize_text_field($duplication_data['operationId']) : '';
                $is_new_blank_dish = isset($duplication_data['isNewBlankDish']) ? filter_var($duplication_data['isNewBlankDish'], FILTER_VALIDATE_BOOLEAN) : false;

                if (empty($post_id) || (empty($section_id) && !$is_new_blank_dish) || empty($operation_id)) {
                    continue;
                }

                // Store operation info
                $duplication_operations[$operation_id] = array(
                    'post_id' => $post_id,
                    'section_id' => $section_id,
                    'parent_category' => $parent_category,
                    'is_category' => $is_category,
                    'is_new_blank_dish' => $is_new_blank_dish,
                    'new_section_id' => '',
                    'widget_map' => array()
                );
            }

            // Process each duplication operation
            foreach ($duplication_operations as $operation_id => $operation) {
                $post_id = $operation['post_id'];
                $section_id = $operation['section_id'];
                $is_new_blank_dish = $operation['is_new_blank_dish'];
                $parent_category = $operation['parent_category'];

                // Get document
                $document = $this->get_elementor_document($post_id);
                if (!$document) {
                    continue;
                }

                $elementor_data = $document->get_elements_data();
                if (!$elementor_data) {
                    continue;
                }

                // Handle differently based on whether it's a new blank dish or a regular duplication
                if ($is_new_blank_dish) {
                    // For new blank dishes, use regular duplication (content will be modified by frontend)
                    error_log("EFE: Processing new blank dish via duplication: $operation_id");
                    
                    // Use regular duplication first
                    $result = EFE_Section_Handler::find_and_duplicate_section(
                        $elementor_data, 
                        $section_id, 
                        $parent_category, 
                        $operation['is_category']
                    );
                    
                    if ($result['success']) {
                        $new_section_id = $result['new_section_id'];
                        
                        // Save the document
                        $document->save(array('elements' => $elementor_data));
                        
                        // Now find all widgets in the new section to build a map
                        $widgets_in_section = $this->find_widgets_in_section($post_id, $new_section_id);
                        $duplication_operations[$operation_id]['widget_map'] = $widgets_in_section;
                        
                        // Add duplication entry
                        $results['duplications'][] = array(
                            'operation_id' => $operation_id,
                            'section_id' => $section_id,
                            'new_section_id' => $new_section_id,
                            'widget_count' => count($widgets_in_section),
                            'success' => true,
                            'is_blank_dish' => true,
                            'widget_mappings' => array()
                        );
                        
                        error_log("EFE: Added duplication entry for new blank dish: " . json_encode($results['duplications']));
                    }
                } else {
                    // Regular duplication
                    $result = EFE_Section_Handler::find_and_duplicate_section(
                        $elementor_data, 
                        $section_id, 
                        $parent_category, 
                        $operation['is_category']
                    );
                }

                if (!isset($result['success']) || !$result['success']) {
                    error_log("EFE: Failed to create new dish or duplicate section for operation $operation_id");
                    continue;
                }

                // Store the new section ID
                $new_section_id = $result['new_section_id'];
                $duplication_operations[$operation_id]['new_section_id'] = $new_section_id;
                
                // Only copy attributes for regular duplications, not for blank dishes
                if (!$is_new_blank_dish) {
                    $this->copy_section_attributes($post_id, $section_id, $new_section_id);
                } else {
                    // For new blank dishes, set default attributes (all false)
                    $this->set_default_section_attributes($post_id, $new_section_id);
                }

                // Save document to ensure all IDs are generated
                $document->save(array('elements' => $elementor_data));

                // Now find all widgets in the new section to build a map
                $widgets_in_section = $this->find_widgets_in_section($post_id, $new_section_id);
                $duplication_operations[$operation_id]['widget_map'] = $widgets_in_section;

                $duplication_entry = array(
                    'operation_id' => $operation_id,
                    'section_id' => $section_id,
                    'new_section_id' => $new_section_id,
                    'widget_count' => count($widgets_in_section),
                    'success' => true,
                    'is_blank_dish' => $is_new_blank_dish,
                    'widget_mappings' => array() // Will be populated during widget processing
                );
                
                error_log("EFE: Adding duplication entry: " . json_encode($duplication_entry));
                $results['duplications'][] = $duplication_entry;
            }

            // Now apply widget changes to the duplicated sections
            if (!empty($changes['widgets']) && is_array($changes['widgets'])) {
                foreach ($changes['widgets'] as $widget_id => $widget_data) {
                    // Skip if not in a duplicate
                    if (!isset($widget_data['isInDuplicate']) || !$widget_data['isInDuplicate']) {
                        continue;
                    }

                    $operation_id = isset($widget_data['operationId']) ? $widget_data['operationId'] : '';
                    if (empty($operation_id) || !isset($duplication_operations[$operation_id])) {
                        continue;
                    }

                    $operation = $duplication_operations[$operation_id];
                    $widget_index = isset($widget_data['index']) ? intval($widget_data['index']) : -1;
                    $is_new_dish = isset($widget_data['isNewDish']) ? filter_var($widget_data['isNewDish'], FILTER_VALIDATE_BOOLEAN) : false;

                    if ($is_new_dish) {
                        // For new dishes, use the widget map from the duplication operation
                        $new_section_id = $operation['new_section_id'];
                        error_log("EFE: Processing new dish widget $widget_id, section $new_section_id, index $widget_index");
                        
                        if ($new_section_id && $widget_index >= 0 && isset($operation['widget_map'][$widget_index])) {
                            $real_widget_id = $operation['widget_map'][$widget_index];
                            error_log("EFE: Found real widget ID: $real_widget_id for new dish widget $widget_id");
                            
                            if ($real_widget_id) {
                                $update_result = $this->update_widget_by_id(
                                    $operation['post_id'],
                                    $real_widget_id,
                                    $widget_data['widgetType'],
                                    $widget_data,
                                    $results['widgets']
                                );
                                error_log("EFE: Update result for new dish widget $widget_id: " . ($update_result ? 'success' : 'failed'));
                                
                                // Store widget mapping for frontend
                                if (!isset($results['widget_mappings'])) {
                                    $results['widget_mappings'] = array();
                                }
                                $results['widget_mappings'][] = array(
                                    'temp_id' => $widget_id,
                                    'real_id' => $real_widget_id,
                                    'section_id' => $new_section_id
                                );
                                
                                // Also add to the specific duplication's widget mappings
                                foreach ($results['duplications'] as &$dup) {
                                    if ($dup['operation_id'] === $operation_id) {
                                        if (!isset($dup['widget_mappings'])) {
                                            $dup['widget_mappings'] = array();
                                        }
                                        $dup['widget_mappings'][] = array(
                                            'temp_id' => $widget_id,
                                            'real_id' => $real_widget_id,
                                            'section_id' => $new_section_id
                                        );
                                        break;
                                    }
                                }
                            } else {
                                // Log error for debugging
                                error_log("EFE: Could not find widget at index $widget_index in new dish section $new_section_id");
                                $results['widgets'][$widget_id] = array(
                                    'success' => false,
                                    'message' => "Widget not found in new dish section"
                                );
                            }
                        } else {
                            // Log error for debugging
                            error_log("EFE: Missing new_section_id ($new_section_id) or widget_index ($widget_index) for new dish widget $widget_id");
                            $results['widgets'][$widget_id] = array(
                                'success' => false,
                                'message' => "Missing section ID or widget index"
                            );
                        }
                    } else {
                        // For regular duplications, use the widget map
                        if ($widget_index >= 0 && isset($operation['widget_map'][$widget_index])) {
                            $real_widget_id = $operation['widget_map'][$widget_index];
                            $post_id = $operation['post_id'];

                            // Apply the change to the real widget
                            $this->update_widget_by_id(
                                $post_id,
                                $real_widget_id,
                                $widget_data['widgetType'],
                                $widget_data,
                                $results['widgets']
                            );
                        }
                    }
                }
            }
        }

        // Process other widget changes (not in duplicated sections)
        if (!empty($changes['widgets']) && is_array($changes['widgets'])) {
            foreach ($changes['widgets'] as $widget_id => $widget_data) {
                // Skip widgets in duplicated sections - they were handled above
                if (isset($widget_data['isInDuplicate']) && $widget_data['isInDuplicate']) {
                    continue;
                }

                $post_id = isset($widget_data['postId']) ? intval($widget_data['postId']) : 0;
                $widget_type = isset($widget_data['widgetType']) ? sanitize_text_field($widget_data['widgetType']) : '';
                
                if (empty($post_id) || empty($widget_id) || empty($widget_type)) {
                    $results['widgets'][$widget_id] = array(
                        'success' => false,
                        'message' => 'Incomplete widget data'
                    );
                    continue;
                }
                
                // Get Elementor document
                $document = $this->get_elementor_document($post_id);
                if (!$document) {
                    $results['widgets'][$widget_id] = array(
                        'success' => false,
                        'message' => 'Document not found'
                    );
                    continue;
                }
                
                $elementor_data = $document->get_elements_data();
                
                if (!$elementor_data) {
                    $results['widgets'][$widget_id] = array(
                        'success' => false,
                        'message' => 'Elementor data not found'
                    );
                    continue;
                }
                
                // Special handling for image widgets
                if ($widget_type === 'image' && isset($widget_data['imageId'])) {
                    // Create the expected structure for image widgets
                    $image_data = array(
                        'widget_id' => $widget_id,
                        'post_id' => $post_id,
                        'widget_type' => 'image',
                        'image_id' => intval($widget_data['imageId'])
                    );
                    
                    // Update the widget with this specific structure
                    $updated = EFE_Widget_Handler::find_and_update_widget($elementor_data, $widget_id, $widget_type, $image_data);
                } else {
                    // For other widget types, use the standard update
                    $updated = EFE_Widget_Handler::find_and_update_widget($elementor_data, $widget_id, $widget_type, $widget_data);
                }
                
                if (!$updated) {
                    $results['widgets'][$widget_id] = array(
                        'success' => false,
                        'message' => 'Widget not found in Elementor data'
                    );
                    continue;
                }
                
                // Save the updated elements data
                $document->save(array(
                    'elements' => $elementor_data
                ));
                
                $results['widgets'][$widget_id] = array(
                    'success' => true,
                    'message' => 'Widget updated successfully'
                );
            }
        }

        // Process attributes changes
        if (!empty($changes['attributes']) && is_array($changes['attributes'])) {
            foreach ($changes['attributes'] as $key => $attribute_data) {
                $type = isset($attribute_data['type']) ? sanitize_text_field($attribute_data['type']) : '';
                $post_id = isset($attribute_data['postId']) ? intval($attribute_data['postId']) : 0;
                $section_id = isset($attribute_data['sectionId']) ? sanitize_text_field($attribute_data['sectionId']) : '';
                $attributes = isset($attribute_data['attributes']) ? $attribute_data['attributes'] : array();

                if (empty($post_id) || empty($section_id) || empty($attributes)) {
                    $results['attributes'][$key] = array(
                        'success' => false,
                        'message' => 'Incomplete attribute data'
                    );
                    continue;
                }

                // Check if this is a duplicated section by looking for dup-section- prefix
                $real_section_id = $section_id;
                if (strpos($section_id, 'dup-section-') === 0) {
                    // Extract operation ID from section ID (format: dup-section-OPERATIONID)
                    $operation_id = str_replace('dup-section-', '', $section_id);
                    
                    // Look for the real section ID in duplication operations
                    if (!empty($duplication_operations[$operation_id]['new_section_id'])) {
                        $real_section_id = $duplication_operations[$operation_id]['new_section_id'];
                        
                        
                    }
                }

                if ($type === 'dish') {
                    $result = EFE_Dish_Attributes::save_attributes($post_id, $real_section_id, $attributes);
                } else if ($type === 'allergen') {
                    $result = EFE_Allergen_Attributes::save_attributes($post_id, $real_section_id, $attributes);
                } else {
                    $results['attributes'][$key] = array(
                        'success' => false,
                        'message' => 'Unknown attribute type'
                    );
                    continue;
                }

                $results['attributes'][$key] = $result;
            }
        }

        // Process removals
        if (!empty($changes['removals']) && is_array($changes['removals'])) {
            foreach ($changes['removals'] as $removal_data) {
                $post_id = isset($removal_data['postId']) ? intval($removal_data['postId']) : 0;
                $section_id = isset($removal_data['sectionId']) ? sanitize_text_field($removal_data['sectionId']) : '';
                $parent_category = isset($removal_data['parentCategory']) ? sanitize_text_field($removal_data['parentCategory']) : '';
                
                if (empty($post_id) || empty($section_id)) {
                    $results['removals'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Incomplete removal data'
                    );
                    continue;
                }
                
                // Get Elementor document
                $document = $this->get_elementor_document($post_id);
                if (!$document) {
                    $results['removals'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Document not found'
                    );
                    continue;
                }
                
                $elementor_data = $document->get_elements_data();
                
                if (!$elementor_data) {
                    $results['removals'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Elementor data not found'
                    );
                    continue;
                }
                
                // Delete the section with EFE_Section_Handler
                $deleted = EFE_Section_Handler::find_and_delete_section($elementor_data, $section_id, $parent_category);
                
                if (!$deleted) {
                    $results['removals'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Section not found in Elementor data'
                    );
                    continue;
                }
                
                // Update Elementor data
                $document->save(array(
                    'elements' => $elementor_data
                ));
                
                $results['removals'][] = array(
                    'section_id' => $section_id,
                    'success' => true,
                    'message' => 'Section deleted successfully'
                );
            }
        }

        // Process movements
        if (!empty($changes['movements']) && is_array($changes['movements'])) {
            foreach ($changes['movements'] as $movement_data) {
                $post_id = isset($movement_data['postId']) ? intval($movement_data['postId']) : 0;
                $section_id = isset($movement_data['sectionId']) ? sanitize_text_field($movement_data['sectionId']) : '';
                $direction = isset($movement_data['direction']) ? sanitize_text_field($movement_data['direction']) : '';
                $is_category = isset($movement_data['isCategory']) ? filter_var($movement_data['isCategory'], FILTER_VALIDATE_BOOLEAN) : false;
                $parent_category = isset($movement_data['parentCategory']) ? sanitize_text_field($movement_data['parentCategory']) : '';
                
                if (empty($post_id) || empty($section_id) || empty($direction) || !in_array($direction, array('up', 'down'))) {
                    $results['movements'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Incomplete or invalid movement data'
                    );
                    continue;
                }
                
                // Get Elementor document
                $document = $this->get_elementor_document($post_id);
                if (!$document) {
                    $results['movements'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Document not found'
                    );
                    continue;
                }
                
                $elementor_data = $document->get_elements_data();
                
                if (!$elementor_data) {
                    $results['movements'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => 'Elementor data not found'
                    );
                    continue;
                }
                
                // Move the section with EFE_Section_Handler
                $result = EFE_Section_Handler::find_and_move_section_hierarchical($elementor_data, $section_id, $direction, $is_category, $parent_category);
                
                if (!isset($result['success']) || !$result['success']) {
                    $results['movements'][] = array(
                        'section_id' => $section_id,
                        'success' => false,
                        'message' => isset($result['message']) ? $result['message'] : 'Failed to move section'
                    );
                    continue;
                }
                
                // Update Elementor data
                $document->save(array(
                    'elements' => $elementor_data
                ));
                
                $results['movements'][] = array(
                    'section_id' => $section_id,
                    'success' => true,
                    'message' => 'Section moved successfully'
                );
            }
        }
        
        // Log final results for debugging
        error_log("EFE: Batch save completed. Results: " . json_encode($results));
        
        wp_send_json_success(array(
            'message' => 'Batch changes processed',
            'results' => $results
        ));
    }
    
    /**
     * Find widget in a section by index
     */
    private function find_widget_in_section_by_index($post_id, $section_id, $widget_index) {
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return null;
        }
        
        $elementor_data = $document->get_elements_data();
        if (!$elementor_data) {
            return null;
        }
        
        // Find the section
        $section = null;
        $find_section_fn = function($elements, $target_id) use (&$find_section_fn) {
            foreach ($elements as $element) {
                if (isset($element['id']) && $element['id'] === $target_id) {
                    return $element;
                }
                
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $found = $find_section_fn($element['elements'], $target_id);
                    if ($found) {
                        return $found;
                    }
                }
            }
            
            return null;
        };
        
        $section = $find_section_fn($elementor_data, $section_id);
        if (!$section) {
            return null;
        }
        
        // Collect all widgets in order
        $widgets = array();
        $collect_widgets_fn = function($element) use (&$collect_widgets_fn, &$widgets) {
            if (isset($element['widgetType'])) {
                $widgets[] = $element['id'];
                return;
            }
            
            if (isset($element['elements']) && is_array($element['elements'])) {
                foreach ($element['elements'] as $child) {
                    $collect_widgets_fn($child);
                }
            }
        };
        
        $collect_widgets_fn($section);
        
        // Return the widget ID at the specified index
        return isset($widgets[$widget_index]) ? $widgets[$widget_index] : null;
    }
    
    /**
     * Find all widgets in a section by position
     */
    private function find_widgets_in_section($post_id, $section_id) {
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return array();
        }
        
        $elementor_data = $document->get_elements_data();
        if (!$elementor_data) {
            return array();
        }
        
        // Find the section
        $section = null;
        $find_section_fn = function($elements, $target_id) use (&$find_section_fn) {
            foreach ($elements as $element) {
                if (isset($element['id']) && $element['id'] === $target_id) {
                    return $element;
                }
                
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $found = $find_section_fn($element['elements'], $target_id);
                    if ($found) {
                        return $found;
                    }
                }
            }
            
            return null;
        };
        
        $section = $find_section_fn($elementor_data, $section_id);
        if (!$section) {
            return array();
        }
        
        // Collect all widgets in order
        $widgets = array();
        $collect_widgets_fn = function($element) use (&$collect_widgets_fn, &$widgets) {
            if (isset($element['widgetType'])) {
                $widgets[] = $element['id'];
                return;
            }
            
            if (isset($element['elements']) && is_array($element['elements'])) {
                foreach ($element['elements'] as $child) {
                    $collect_widgets_fn($child);
                }
            }
        };
        
        $collect_widgets_fn($section);
        
        // Return a map of index => widget_id
        $widget_map = array();
        foreach ($widgets as $index => $widget_id) {
            $widget_map[$index] = $widget_id;
        }
        
        return $widget_map;
    }
    
    /**
     * Update a widget by its ID
     * Returns true on success, false on failure
     */
    private function update_widget_by_id($post_id, $widget_id, $widget_type, $widget_data, &$results) {
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return false;
        }
        
        $elementor_data = $document->get_elements_data();
        if (!$elementor_data) {
            return false;
        }
        
        // Prepare the update data
        $update_data = array(
            'widget_id' => $widget_id,
            'post_id' => $post_id,
            'widget_type' => $widget_type
        );
        
        // Copy relevant fields based on widget type
        switch ($widget_type) {
            case 'heading':
                if (isset($widget_data['title'])) {
                    $update_data['title'] = $widget_data['title'];
                }
                break;
                
            case 'price-heading':
                // Add proper handling for price-heading widgets
                if (isset($widget_data['price_value'])) {
                    $update_data['price_value'] = $widget_data['price_value'];
                    $update_data['currency'] = isset($widget_data['currency']) ? $widget_data['currency'] : '€';
                    $update_data['currency_position'] = isset($widget_data['currency_position']) ? $widget_data['currency_position'] : 'before';
                    $update_data['show_currency'] = isset($widget_data['show_currency']) ? $widget_data['show_currency'] : true;
                }
                break;
                
            case 'text-editor':
                if (isset($widget_data['content'])) {
                    $update_data['content'] = $widget_data['content'];
                }
                break;
                
            case 'image':
                if (isset($widget_data['imageId'])) {
                    if ($widget_data['imageId'] === '' || $widget_data['imageId'] === 'placeholder') {
                        // This is a placeholder image - set empty ID to force placeholder
                        $update_data['image_id'] = '';
                    } else {
                        $update_data['image_id'] = intval($widget_data['imageId']);
                    }
                }
                break;
                
            case 'price-table':
            case 'price-list':
                if (isset($widget_data['price'])) {
                    $update_data['price'] = $widget_data['price'];
                }
                break;
        }
        
        // Update the widget
        $updated = EFE_Widget_Handler::find_and_update_widget(
            $elementor_data,
            $widget_id,
            $widget_type,
            $update_data
        );
        
        if (!$updated) {
            error_log("EFE: Failed to update widget $widget_id");
            return false;
        }
        
        // Save changes
        $save_result = $document->save(array('elements' => $elementor_data));
        
        if (is_wp_error($save_result)) {
            error_log("EFE: Failed to save document after updating widget $widget_id: " . $save_result->get_error_message());
            return false;
        }
        
        // Record result
        $results[$widget_id] = array(
            'success' => true,
            'message' => 'Widget updated in duplicated section',
            'real_widget_id' => $widget_id
        );
        
        error_log("EFE: Successfully updated widget $widget_id");
        return true;
    }
    
    /**
     * Process widget edit in a duplicated section
     * This requires finding the corresponding widget in the newly created section
     */
    private function process_widget_in_duplicated_section($post_id, $new_section_id, $temp_widget_id, $widget_type, $widget_data) {
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) {
            return array(
                'success' => false,
                'message' => 'Document not found'
            );
        }

        if ($widget_type === 'price-heading') {
            // Format the price with currency
            $price_value = isset($widget_data['price_value']) ? $widget_data['price_value'] : '';
            $currency = isset($widget_data['currency']) ? $widget_data['currency'] : '€';
            $currency_position = isset($widget_data['currency_position']) ? $widget_data['currency_position'] : 'before';
            $show_currency = isset($widget_data['show_currency']) ? (bool)$widget_data['show_currency'] : true;
            
            // Create the expected data structure for price headings
            $price_data = array(
                'widget_id' => $new_widget_id, // Use the real ID, not the temporary one
                'post_id' => $post_id,
                'widget_type' => 'price-heading',
                'price_value' => $price_value,
                'currency' => $currency,
                'currency_position' => $currency_position,
                'show_currency' => $show_currency
            );
            
            // Update the widget with this specific structure
            return EFE_Widget_Handler::find_and_update_widget($elementor_data, $new_widget_id, 'price-heading', $price_data);
        }

        $elementor_data = $document->get_elements_data();
        if (!$elementor_data) {
            return array(
                'success' => false,
                'message' => 'Elementor data not found'
            );
        }

        // Extract position information from the temp ID if available
        $widget_index = 0;
        // Check for both formats: temp-widget-ID-INDEX or dup-widget-OPID-INDEX
        if (preg_match('/(temp|dup)-widget-[\w\-]+-(\d+)/', $temp_widget_id, $matches)) {
            $widget_index = isset($matches[2]) ? intval($matches[2]) : 0;
        }

        console_log("Processing widget in duplicate section: " . $new_section_id . ", widget index: " . $widget_index);

        // Find the newly created section
        $find_section = function($elements, $section_id) use (&$find_section) {
            foreach ($elements as $element) {
                if (isset($element['id']) && $element['id'] === $section_id) {
                    return $element;
                }

                if (isset($element['elements']) && is_array($element['elements'])) {
                    $result = $find_section($element['elements'], $section_id);
                    if ($result) {
                        return $result;
                    }
                }
            }

            return null;
        };

        // Find the section
        $new_section = $find_section($elementor_data, $new_section_id);

        if (!$new_section) {
            return array(
                'success' => false,
                'message' => 'Could not find newly created section: ' . $new_section_id
            );
        }

        // Now we need to find the corresponding widget by type and index
        $all_widgets = array();

        // Function to collect all widgets in a section
        $collect_widgets = function($element, $widget_type_to_match = null) use (&$collect_widgets, &$all_widgets) {
            if (isset($element['widgetType'])) {
                // If we're matching a specific widget type and this doesn't match, skip
                if ($widget_type_to_match && $element['widgetType'] !== $widget_type_to_match) {
                    return;
                }

                $all_widgets[] = $element;
                return;
            }

            if (isset($element['elements']) && is_array($element['elements'])) {
                foreach ($element['elements'] as $child) {
                    $collect_widgets($child, $widget_type_to_match);
                }
            }
        };

        // Collect all widgets of the matching type in the section
        $collect_widgets($new_section, $widget_type);

        // Check if we have a widget at the right index
        if (count($all_widgets) <= $widget_index) {
            

            return array(
                'success' => false,
                'message' => 'Widget index out of range in duplicated section (' . $widget_index . ' >= ' . count($all_widgets) . ')'
            );
        }

        // Get the widget at the right index
        $target_widget = $all_widgets[$widget_index];
        $new_widget_id = $target_widget['id'];



        // Now we can update this widget with the changes
        $updated = false;

        // Special handling for image widgets
        if ($widget_type === 'image' && isset($widget_data['imageId'])) {
            // Create the expected structure for image widgets
            $image_data = array(
                'widget_id' => $new_widget_id,
                'post_id' => $post_id,
                'widget_type' => 'image',
                'image_id' => intval($widget_data['imageId'])
            );

            // Update the widget with this specific structure
            $updated = EFE_Widget_Handler::find_and_update_widget($elementor_data, $new_widget_id, $widget_type, $image_data);
        } else {
            // For other widget types, update the widget ID and use the standard update
            $widget_data['widget_id'] = $new_widget_id;
            $updated = EFE_Widget_Handler::find_and_update_widget($elementor_data, $new_widget_id, $widget_type, $widget_data);
        }

        if (!$updated) {
            return array(
                'success' => false,
                'message' => 'Could not update widget in duplicated section - widget not found in structure'
            );
        }

        // Save the updated elements data
        $document->save(array(
            'elements' => $elementor_data
        ));

        return array(
            'success' => true,
            'message' => 'Widget in duplicated section updated successfully',
            'new_widget_id' => $new_widget_id
        );
    }
    
    /**
     * Reset the content of a duplicated section to placeholder values
     */
    private function reset_duplicated_section_content(&$elements, $section_id) {
        $find_and_reset = function(&$elements) use (&$find_and_reset, $section_id) {
            foreach ($elements as &$element) {
                if (isset($element['id']) && $element['id'] === $section_id) {
                    // Found the section, reset its content
                    if (isset($element['elements']) && is_array($element['elements'])) {
                        foreach ($element['elements'] as &$child) {
                            if (isset($child['widgetType'])) {
                                // Reset widget content based on type
                                switch ($child['widgetType']) {
                                    case 'heading':
                                        $child['settings']['title'] = 'Scrivi il titolo qui...';
                                        break;
                                    case 'text-editor':
                                        $child['settings']['editor'] = '<p>Scrivi il testo qui...</p>';
                                        break;
                                    case 'image':
                                        $child['settings']['image']['url'] = '/wp-content/plugins/elementor/assets/images/placeholder.png';
                                        $child['settings']['image']['id'] = '';
                                        $child['settings']['image']['alt'] = 'Placeholder';
                                        $child['settings']['image']['width'] = '';
                                        $child['settings']['image']['height'] = '';
                                        $child['settings']['image']['size'] = 'full';
                                        break;
                                    case 'price-heading':
                                        $child['settings']['title'] = '0€';
                                        $child['settings']['efe_price_value'] = '0';
                                        $child['settings']['efe_currency'] = '€';
                                        $child['settings']['efe_currency_position'] = 'after';
                                        $child['settings']['efe_show_currency'] = true;
                                        break;
                                }
                            }
                        }
                    }
                    return true;
                }
                
                if (isset($element['elements']) && is_array($element['elements'])) {
                    if ($find_and_reset($element['elements'])) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        $find_and_reset($elements);
    }
    
    /**
     * Set default attributes for new sections (all false)
     */
    private function set_default_section_attributes($post_id, $section_id) {
        // Set default dish attributes (all false)
        $default_dish_attributes = array(
            'vegetarian' => false,
            'chef_special' => false,
            'gluten_free' => false,
            'spicy' => false
        );
        EFE_Dish_Attributes::save_attributes($post_id, $section_id, $default_dish_attributes);
        
        // Set default allergen attributes (all false)
        $default_allergen_attributes = array(
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
        EFE_Allergen_Attributes::save_attributes($post_id, $section_id, $default_allergen_attributes);
    }
    
    /**
     * Copy section attributes from one section to another
     */
    private function copy_section_attributes($post_id, $original_section_id, $new_section_id) {
        // Copy dish attributes for the section itself
        $dish_attributes = EFE_Dish_Attributes::get_attributes($post_id, $original_section_id);
        if ($dish_attributes !== null) {
            EFE_Dish_Attributes::save_attributes($post_id, $new_section_id, $dish_attributes);
        }
        // Copy allergen attributes for the section itself
        $allergen_attributes = EFE_Allergen_Attributes::get_attributes($post_id, $original_section_id);
        if ($allergen_attributes !== null) {
            EFE_Allergen_Attributes::save_attributes($post_id, $new_section_id, $allergen_attributes);
        }
    }

    /**
     * Recursively copy attributes for all child sections/items
     */
    private function copy_child_section_attributes_recursive($post_id, $original_parent_id, $new_parent_id) {
        // Get Elementor document
        $document = $this->get_elementor_document($post_id);
        if (!$document) return;
        $elementor_data = $document->get_elements_data();
        if (!$elementor_data) return;
        // Find original and new parent sections
        $find_section = function($elements, $section_id) use (&$find_section) {
            foreach ($elements as $element) {
                if (isset($element['id']) && $element['id'] === $section_id) {
                    return $element;
                }
                if (isset($element['elements']) && is_array($element['elements'])) {
                    $result = $find_section($element['elements'], $section_id);
                    if ($result) return $result;
                }
            }
            return null;
        };
        $original_section = $find_section($elementor_data, $original_parent_id);
        $new_section = $find_section($elementor_data, $new_parent_id);
        if (!$original_section || !$new_section) return;
        // Recursively copy attributes for all child sections/items
        $copy_recursive = function($orig, $copy) use (&$copy_recursive, $post_id) {
            if (!isset($orig['elements']) || !isset($copy['elements'])) return;
            foreach ($orig['elements'] as $i => $orig_child) {
                if (!isset($copy['elements'][$i])) continue;
                $copy_child = $copy['elements'][$i];
                if (isset($orig_child['id']) && isset($copy_child['id'])) {
                    // Copy dish attributes
                    $dish_attributes = EFE_Dish_Attributes::get_attributes($post_id, $orig_child['id']);
                    if (!empty($dish_attributes)) {
                        EFE_Dish_Attributes::save_attributes($post_id, $copy_child['id'], $dish_attributes);
                    }
                    // Copy allergen attributes
                    $allergen_attributes = EFE_Allergen_Attributes::get_attributes($post_id, $orig_child['id']);
                    if (!empty($allergen_attributes)) {
                        EFE_Allergen_Attributes::save_attributes($post_id, $copy_child['id'], $allergen_attributes);
                    }
                }
                // Recurse
                $copy_recursive($orig_child, $copy_child);
            }
        };
        $copy_recursive($original_section, $new_section);
    }

    /**
     * Reset content for a blank dish
     */
    private function reset_blank_dish_content(&$elements, $section_id) {

        
        $reset_section = function(&$section) {

            
            // Process each column/container inside this section
            if (isset($section['elements']) && is_array($section['elements'])) {
                foreach ($section['elements'] as &$column) {
                    // Process widgets inside this column
                    if (isset($column['elements']) && is_array($column['elements'])) {
                        foreach ($column['elements'] as &$widget) {
                            // Skip non-widgets
                            if (!isset($widget['widgetType'])) {
                                continue;
                            }
                            
                            $widget_id = isset($widget['id']) ? $widget['id'] : 'unknown';
            
                            
                            // Reset content based on widget type
                            switch ($widget['widgetType']) {
                                case 'heading':
                                    $widget['settings']['title'] = 'Scrivi il titolo qui...';
    
                                    break;
                                
                                case 'text-editor':
                                    $widget['settings']['editor'] = '<p>Scrivi il testo qui...</p>';
    
                                    break;
                                
                                case 'price-table':
                                case 'price-list':
                                    if (isset($widget['settings']['price'])) {
                                        $widget['settings']['price'] = '0';
        
                                    }
                                    break;
                                
                                case 'image':
                                    // Reset image to default placeholder
                                    if (isset($widget['settings']['image'])) {
        
                                        $widget['settings']['image'] = array(
                                            'url' => '/wp-content/plugins/elementor/assets/images/placeholder.png',
                                            'id' => ''
                                        );
                                    }
                                    break;
                            }
                            
                            // Special handling for price headings (which are actually just heading widgets)
                            if ($widget['widgetType'] === 'heading' && 
                                (isset($widget['settings']['_css_classes']) && 
                                 strpos($widget['settings']['_css_classes'], 'price') !== false)) {
                                

                                // This is a price heading, set special price fields
                                $widget['settings']['title'] = '0€';
                                $widget['settings']['efe_price_value'] = '0';
                                $widget['settings']['efe_currency'] = '€';
                                $widget['settings']['efe_currency_position'] = 'after';
                                $widget['settings']['efe_show_currency'] = true;
                            }
                        }
                    }
                }
            }
            
            return true;
        };
        
        // Traverse the elements tree to find and reset the section
        $find_and_reset = function(&$elements) use (&$find_and_reset, $section_id, $reset_section) {
            foreach ($elements as &$element) {
                // If this is the section we're looking for
                if (isset($element['id']) && $element['id'] === $section_id) {
        
                    return $reset_section($element);
                }
                
                // If not found, search in children
                if (isset($element['elements']) && is_array($element['elements'])) {
                    if ($find_and_reset($element['elements'])) {
                        return true;
                    }
                }
            }
            
            return false;
        };
        
        $result = $find_and_reset($elements);

        return $result;
    }
    
    /**
     * Update all price headings in Elementor data with new currency settings
     */
    private function update_all_price_headings(&$elements, $currency, $currency_position, $show_currency) {
        $updated_count = 0;
        
        foreach ($elements as &$element) {
            // Check if this is a heading widget with price class (price-heading)
            if (isset($element['widgetType']) && $element['widgetType'] === 'heading') {
                $css_classes = isset($element['settings']['_css_classes']) ? $element['settings']['_css_classes'] : '';
                
                // Check if this is a price heading (contains 'price' in CSS classes)
                if (strpos($css_classes, 'price') !== false || 
                    isset($element['settings']['efe_price_value'])) {
                    
                    // Get current price value
                    $price_value = isset($element['settings']['efe_price_value']) ? $element['settings']['efe_price_value'] : '';
                    
                    // If no stored price value, try to extract from title
                    if (empty($price_value) && isset($element['settings']['title'])) {
                        $title = $element['settings']['title'];
                        // Remove common currency symbols and extract numeric value
                        $price_value = preg_replace('/[€$£¥₽₣Fr.\s]/u', '', $title);
                        $price_value = trim($price_value);
                    }
                    
                    // Format the price with new settings
                    $formatted_price = $price_value;
                    if ($show_currency && !empty($price_value)) {
                        $formatted_price = ($currency_position === 'before') ? 
                            $currency . $price_value : 
                            $price_value . $currency;
                    }
                    
                    // Update the widget settings
                    $element['settings']['title'] = $formatted_price;
                    $element['settings']['efe_price_value'] = $price_value;
                    $element['settings']['efe_currency'] = $currency;
                    $element['settings']['efe_currency_position'] = $currency_position;
                    $element['settings']['efe_show_currency'] = $show_currency;
                    
                    $updated_count++;
                }
            }
            
            // Recursively check child elements
            if (isset($element['elements']) && is_array($element['elements'])) {
                $updated_count += $this->update_all_price_headings($element['elements'], $currency, $currency_position, $show_currency);
            }
        }
        
        return $updated_count;
    }
}