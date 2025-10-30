<?php
/**
 * Editor UI Class
 * Handles rendering of UI elements for the frontend editor
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class EFE_Editor_UI {
    
    /**
     * Initialize the editor UI
     */
    public function init() {
        // Add edit button (only for logged in users with permissions)
        add_action('wp_footer', array($this, 'add_edit_button'));

        // Add editor markup (only for logged in users with permissions)
        add_action('wp_footer', array($this, 'add_editor_markup'));

        // Add dish icons CSS (for ALL users, no permission check)
        add_action('wp_head', array($this, 'add_dish_icons_css'));
    }
    
    /**
     * Add dish icons CSS for showing/hiding icons based on attributes
     */
    public function add_dish_icons_css() {
        if (!is_singular()) {
            return;
        }

        $post_id = get_the_ID();
        global $wpdb;
        
        // Dish attributes
        $meta_keys = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT meta_key, meta_value FROM $wpdb->postmeta 
                 WHERE post_id = %d AND meta_key LIKE %s",
                $post_id,
                'efe_dish_attributes_%'
            )
        );

        echo '<style>';
        foreach ($meta_keys as $meta) {
            $section_id = str_replace('efe_dish_attributes_', '', $meta->meta_key);
            $attributes = maybe_unserialize($meta->meta_value);

            if (!is_array($attributes)) continue;

            // Create both direct selectors and fallback selectors for each attribute
            if (isset($attributes['vegetarian']) && !$attributes['vegetarian']) {
                echo "[data-section-id='$section_id'] [id*='vegetarian'], 
                      [data-section-id='$section_id'] [class*='vegetarian'],
                      #elementor-element-$section_id [id*='vegetarian'],
                      #elementor-element-$section_id [class*='vegetarian'],
                      .elementor-element-$section_id [id*='vegetarian'],
                      .elementor-element-$section_id [class*='vegetarian'] { display: none !important; }\n";
            }

            if (isset($attributes['chef_special']) && !$attributes['chef_special']) {
                echo "[data-section-id='$section_id'] [id*='chef-special'], 
                      [data-section-id='$section_id'] [class*='chef-special'],
                      #elementor-element-$section_id [id*='chef-special'],
                      #elementor-element-$section_id [class*='chef-special'],
                      .elementor-element-$section_id [id*='chef-special'],
                      .elementor-element-$section_id [class*='chef-special'] { display: none !important; }\n";
            }

            if (isset($attributes['gluten_free']) && !$attributes['gluten_free']) {
                echo "[data-section-id='$section_id'] [id*='gluten-free'], 
                      [data-section-id='$section_id'] [class*='gluten-free'],
                      #elementor-element-$section_id [id*='gluten-free'],
                      #elementor-element-$section_id [class*='gluten-free'],
                      .elementor-element-$section_id [id*='gluten-free'],
                      .elementor-element-$section_id [class*='gluten-free'] { display: none !important; }\n";
            }

            if (isset($attributes['spicy']) && !$attributes['spicy']) {
                echo "[data-section-id='$section_id'] [id*='spicy'], 
                      [data-section-id='$section_id'] [class*='spicy'],
                      #elementor-element-$section_id [id*='spicy'],
                      #elementor-element-$section_id [class*='spicy'],
                      .elementor-element-$section_id [id*='spicy'],
                      .elementor-element-$section_id [class*='spicy'] { display: none !important; }\n";
            }
        }
        
        // Allergen attributes
        $meta_keys = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT meta_key, meta_value FROM $wpdb->postmeta 
                 WHERE post_id = %d AND meta_key LIKE %s",
                $post_id,
                'efe_allergen_attributes_%'
            )
        );

        foreach ($meta_keys as $meta) {
            $section_id = str_replace('efe_allergen_attributes_', '', $meta->meta_key);
            $attributes = maybe_unserialize($meta->meta_value);

            if (!is_array($attributes)) continue;

            // Create selectors for each allergen attribute
            foreach ($attributes as $allergen => $is_active) {
                if (!$is_active) {
                    echo "[data-section-id='$section_id'] [id*='allergen-$allergen'], 
                          [data-section-id='$section_id'] [class*='allergen-$allergen'],
                          #elementor-element-$section_id [id*='allergen-$allergen'],
                          #elementor-element-$section_id [class*='allergen-$allergen'],
                          .elementor-element-$section_id [id*='allergen-$allergen'],
                          .elementor-element-$section_id [class*='allergen-$allergen'] { display: none !important; }\n";
                }
            }
        }
        
        echo '</style>';
    }
    
    /**
     * Add the edit button to the footer
     */
    public function add_edit_button() {
        if ((current_user_can('edit_posts') || current_user_can('edit_published_posts')) && is_singular()) {
            // Check if page is created with Elementor
            $post_id = get_the_ID();
            $is_elementor_page = $this->is_elementor_page($post_id);

            if ($is_elementor_page) {
                echo '<div id="efe-edit-toggle" class="efe-edit-button">';
                
                // Global currency settings button (only visible in edit mode)
                echo '<button id="efe-global-currency-btn" class="efe-currency-button" style="display: none;" title="' . __('Impostazioni Valuta Globali', 'elementor-frontend-editor') . '">';
                echo '<span class="efe-currency-icon">€</span>';
                echo '</button>';
                
                echo '<button id="toggle-elementor-edit">' . __('Modifica Contenuti', 'elementor-frontend-editor') . '</button>';

                echo '</div>';
            }
        }
    }
    
    /**
     * Check if a page is created with Elementor
     */
    private function is_elementor_page($post_id) {
        $is_elementor_page = false;
        
        // Method 1: Use standard Elementor method (for older versions)
        if (class_exists('\Elementor\Plugin') && method_exists('\Elementor\Plugin::$instance->db', 'is_built_with_elementor')) {
            $is_elementor_page = \Elementor\Plugin::$instance->db->is_built_with_elementor($post_id);
        }
        
        // Method 2: Check metadata (works with containers too)
        if (!$is_elementor_page) {
            $is_elementor_page = (get_post_meta($post_id, '_elementor_edit_mode', true) === 'builder');
        }
        
        // Method 3: Check for Elementor document
        if (!$is_elementor_page && class_exists('\Elementor\Plugin')) {
            $document = \Elementor\Plugin::$instance->documents->get($post_id);
            if ($document) {
                $is_elementor_page = true;
            }
        }
        
        return $is_elementor_page;
    }
    
    /**
     * Add the editor markup to the footer
     */
    public function add_editor_markup() {
        if ((current_user_can('edit_posts') || current_user_can('edit_published_posts')) && is_singular()) {
            $post_id = get_the_ID();
            if (!$this->is_elementor_page($post_id)) {
                return;
            }
            
            // Heading editor modal
            $this->render_heading_editor();
            
            // Price heading editor modal
            $this->render_price_heading_editor();
            
            // Text editor modal
            $this->render_text_editor();
            
            // Image editor modal
            $this->render_image_editor();
            
            // Price editor modal
            $this->render_price_editor();
            
            // Section delete confirmation modal
            $this->render_section_delete_confirm();
            
            // Dish attributes editor modal
            $this->render_dish_attributes_editor();
            
            // Allergen attributes editor modal
            $this->render_allergen_attributes_editor();
            
            // Global currency settings modal
            $this->render_global_currency_editor();
            
            // Loading overlay
            $this->render_loading_overlay();
        }
    }
    
    /**
     * Render the heading editor modal
     */
    private function render_heading_editor() {
        ?>
        <div id="efe-heading-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Modifica Titolo', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-heading-form">
                    <input type="hidden" id="efe-heading-widget-id" name="widget_id" value="">
                    <input type="hidden" id="efe-heading-post-id" name="post_id" value="">
                    <div class="efe-form-group">
                        <label for="efe-heading-title"><?php _e('Titolo:', 'elementor-frontend-editor'); ?></label>
                        <input type="text" id="efe-heading-title" name="title" class="efe-input" required>
                    </div>
                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the price heading editor modal (simplified - no currency settings)
     */
    private function render_price_heading_editor() {
        ?>
        <div id="efe-price-heading-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Modifica Prezzo', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-price-heading-form">
                    <input type="hidden" id="efe-price-heading-widget-id" name="widget_id" value="">
                    <input type="hidden" id="efe-price-heading-post-id" name="post_id" value="">
                    
                    <div class="efe-form-group">
                        <label for="efe-price-heading-value"><?php _e('Prezzo:', 'elementor-frontend-editor'); ?></label>
                        <input type="text" id="efe-price-heading-value" name="price_value" class="efe-input" required>
                        <p class="efe-field-note"><?php _e('Inserisci solo il valore numerico (es: 12.50). Le impostazioni di valuta sono gestite globalmente.', 'elementor-frontend-editor'); ?></p>
                    </div>
                    
                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
                
                <div class="efe-global-currency-note">
                    <p><strong><?php _e('Nota:', 'elementor-frontend-editor'); ?></strong> <?php _e('Per modificare valuta e formato, usa il pulsante delle impostazioni valuta globali.', 'elementor-frontend-editor'); ?></p>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the text editor modal
     */
    private function render_text_editor() {
        ?>
        <div id="efe-text-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Modifica Testo', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-text-form">
                    <input type="hidden" id="efe-text-widget-id" name="widget_id" value="">
                    <input type="hidden" id="efe-text-post-id" name="post_id" value="">
                    <div class="efe-form-group">
                        <label for="efe-text-content"><?php _e('Contenuto:', 'elementor-frontend-editor'); ?></label>
                        <textarea id="efe-text-content" name="content" class="efe-textarea" rows="8" required></textarea>
                    </div>
                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the image editor modal
     */
    private function render_image_editor() {
        ?>
        <div id="efe-image-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Modifica Immagine', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-image-form">
                    <input type="hidden" id="efe-image-widget-id" name="widget_id" value="">
                    <input type="hidden" id="efe-image-post-id" name="post_id" value="">
                    <input type="hidden" id="efe-image-id" name="image_id" value="">
                    <div id="efe-image-preview" class="efe-image-preview"></div>
                    <button type="button" id="efe-select-image" class="efe-select-image-button"><?php _e('Seleziona Immagine', 'elementor-frontend-editor'); ?></button>
                    <p class="efe-image-info" style="margin-top: 10px; font-style: italic; color: #666;"><?php _e('L\'immagine sarà salvata automaticamente dopo la selezione', 'elementor-frontend-editor'); ?></p>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the price editor modal
     */
    private function render_price_editor() {
        ?>
        <div id="efe-price-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Modifica Prezzo', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-price-form">
                    <input type="hidden" id="efe-price-widget-id" name="widget_id" value="">
                    <input type="hidden" id="efe-price-post-id" name="post_id" value="">
                    <div class="efe-form-group">
                        <label for="efe-price-value"><?php _e('Prezzo:', 'elementor-frontend-editor'); ?></label>
                        <input type="text" id="efe-price-value" name="price" class="efe-input" required>
                    </div>
                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the section delete confirmation modal
     */
    private function render_section_delete_confirm() {
        ?>
        <div id="efe-section-delete-confirm" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <h3><?php _e('Elimina Sezione', 'elementor-frontend-editor'); ?></h3>
                <p><?php _e('Sei sicuro di voler eliminare questa sezione? L\'operazione non può essere annullata.', 'elementor-frontend-editor'); ?></p>
                <div class="efe-form-actions">
                    <button type="button" id="confirm-delete-section" class="efe-delete-button"><?php _e('Elimina', 'elementor-frontend-editor'); ?></button>
                    <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                </div>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the dish attributes editor modal
     */
    private function render_dish_attributes_editor() {
        ?>
        <div id="efe-dish-attributes-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Attributi Piatto', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-dish-attributes-form">
                    <input type="hidden" id="efe-dish-section-id" name="section_id" value="">
                    <input type="hidden" id="efe-dish-post-id" name="post_id" value="">

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-dish-vegetarian" name="vegetarian" value="1">
                            <span class="efe-checkbox-label"><?php _e('Vegetariano', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-dish-chef-special" name="chef_special" value="1">
                            <span class="efe-checkbox-label"><?php _e('Chef Special', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-dish-gluten-free" name="gluten_free" value="1">
                            <span class="efe-checkbox-label"><?php _e('Gluten Free', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-dish-spicy" name="spicy" value="1">
                            <span class="efe-checkbox-label"><?php _e('Piccante', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the allergen attributes editor modal
     */
    private function render_allergen_attributes_editor() {
        ?>
        <div id="efe-allergen-attributes-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Allergeni del Piatto', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-allergen-attributes-form">
                    <input type="hidden" id="efe-allergen-section-id" name="section_id" value="">
                    <input type="hidden" id="efe-allergen-post-id" name="post_id" value="">

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-gluten" name="gluten" value="1">
                            <span class="efe-checkbox-label"><?php _e('Glutine (1)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-crustaceans" name="crustaceans" value="1">
                            <span class="efe-checkbox-label"><?php _e('Crostacei (2)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-eggs" name="eggs" value="1">
                            <span class="efe-checkbox-label"><?php _e('Uova (3)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-fish" name="fish" value="1">
                            <span class="efe-checkbox-label"><?php _e('Pesce (4)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-peanuts" name="peanuts" value="1">
                            <span class="efe-checkbox-label"><?php _e('Arachidi (5)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-soy" name="soy" value="1">
                            <span class="efe-checkbox-label"><?php _e('Soia (6)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-milk" name="milk" value="1">
                            <span class="efe-checkbox-label"><?php _e('Latte (7)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-nuts" name="nuts" value="1">
                            <span class="efe-checkbox-label"><?php _e('Frutta a guscio (8)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-celery" name="celery" value="1">
                            <span class="efe-checkbox-label"><?php _e('Sedano (9)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-mustard" name="mustard" value="1">
                            <span class="efe-checkbox-label"><?php _e('Senape (10)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-sesame" name="sesame" value="1">
                            <span class="efe-checkbox-label"><?php _e('Semi di sesamo (11)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-sulphites" name="sulphites" value="1">
                            <span class="efe-checkbox-label"><?php _e('Anidride solforosa e solfiti (12)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-lupin" name="lupin" value="1">
                            <span class="efe-checkbox-label"><?php _e('Lupini (13)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-allergen-molluscs" name="molluscs" value="1">
                            <span class="efe-checkbox-label"><?php _e('Molluschi (14)', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>

                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Salva', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the global currency settings modal
     */
    private function render_global_currency_editor() {
        ?>
        <div id="efe-global-currency-editor" class="efe-editor-modal" style="display: none;">
            <div class="efe-modal-content">
                <span class="efe-close-modal">&times;</span>
                <h3><?php _e('Impostazioni Valuta Globali', 'elementor-frontend-editor'); ?></h3>
                <form id="efe-global-currency-form">
                    <input type="hidden" id="efe-global-post-id" name="post_id" value="">
                    
                    <div class="efe-form-group">
                        <label for="efe-global-currency"><?php _e('Valuta:', 'elementor-frontend-editor'); ?></label>
                        <select id="efe-global-currency" name="currency" class="efe-input">
                            <option value="€">€ (Euro)</option>
                            <option value="$">$ (Dollaro)</option>
                            <option value="£">£ (Sterlina)</option>
                            <option value="¥">¥ (Yen)</option>
                            <option value="₽">₽ (Rublo)</option>
                            <option value="₣">₣ (Franco)</option>
                            <option value="Fr.">Fr. (Franco Svizzero)</option>
                        </select>
                    </div>
                    
                    <div class="efe-form-group">
                        <label><?php _e('Posizione Valuta:', 'elementor-frontend-editor'); ?></label>
                        <div class="efe-radio-group">
                            <label class="efe-radio-container">
                                <input type="radio" id="efe-global-currency-position-before" name="currency_position" value="before" checked>
                                <span class="efe-radio-label"><?php _e('Prima del prezzo (€10)', 'elementor-frontend-editor'); ?></span>
                            </label>
                            <label class="efe-radio-container">
                                <input type="radio" id="efe-global-currency-position-after" name="currency_position" value="after">
                                <span class="efe-radio-label"><?php _e('Dopo il prezzo (10€)', 'elementor-frontend-editor'); ?></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="efe-form-group efe-checkbox-group">
                        <label class="efe-checkbox-container">
                            <input type="checkbox" id="efe-global-show-currency" name="show_currency" value="1" checked>
                            <span class="efe-checkbox-label"><?php _e('Mostra valuta', 'elementor-frontend-editor'); ?></span>
                        </label>
                    </div>
                    
                    <div class="efe-form-actions">
                        <button type="submit" class="efe-save-button"><?php _e('Applica a Tutti i Prezzi', 'elementor-frontend-editor'); ?></button>
                        <button type="button" class="efe-cancel-button"><?php _e('Annulla', 'elementor-frontend-editor'); ?></button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }
    
    /**
     * Render the loading overlay
     */
    private function render_loading_overlay() {
        ?>
        <div id="efe-loading-overlay" class="efe-loading-overlay" style="display: none !important;">
            <div class="efe-loading-content">
                <div class="efe-loading-spinner"></div>
                <div class="efe-loading-text">Salvataggio in corso...</div>
                <div class="efe-loading-subtext">Non chiudere la pagina</div>
            </div>
        </div>
        <?php
    }
}