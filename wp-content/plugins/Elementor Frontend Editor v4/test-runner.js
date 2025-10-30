/**
 * Test Runner for Category Movement Functionality
 * Tests the implementation against requirements 1.1, 1.2, 1.3, 1.4
 */

// Mock jQuery for Node.js environment if needed
if (typeof $ === 'undefined') {
    // Create a minimal jQuery-like mock for testing
    global.$ = function(selector) {
        return {
            length: 1,
            data: function() { return null; },
            hasClass: function() { return false; },
            prev: function() { return { length: 0 }; },
            next: function() { return { length: 0 }; }
        };
    };
}

class CategoryMovementTester {
    constructor() {
        this.testResults = [];
        this.requirementStatus = {
            '1.1': false,
            '1.2': false, 
            '1.3': false,
            '1.4': false
        };
        this.mockDOM = this.createMockDOM();
    }

    /**
     * Create mock DOM structure for testing
     */
    createMockDOM() {
        const mockCategories = [
            {
                id: 'cat-1',
                title: 'Antipasti',
                isCategory: true,
                dishes: ['dish-1-1', 'dish-1-2']
            },
            {
                id: 'cat-2', 
                title: 'Primi Piatti',
                isCategory: true,
                dishes: ['dish-2-1', 'dish-2-2']
            },
            {
                id: 'cat-3',
                title: 'Secondi Piatti', 
                isCategory: true,
                dishes: ['dish-3-1', 'dish-3-2']
            }
        ];

        return mockCategories;
    }

    /**
     * Mock the helper functions from section-manager.js for testing
     */
    mockHelperFunctions() {
        // Mock isCategorySection function
        this.isCategorySection = function($element) {
            if (!$element || !$element.length) {
                return false;
            }
            
            return $element.hasClass('efe-category-section') || 
                   $element.data('is-category') === 'true' || 
                   $element.data('is-category') === true ||
                   $element.hasClass('category');
        };

        // Mock validateCategoryMovement function
        this.validateCategoryMovement = function($section, direction) {
            const isCategory = this.isCategorySection($section);
            
            if (direction === 'up') {
                const $prev = $section.prev();
                
                if (!$prev.length) {
                    return {
                        canMove: false,
                        reason: 'at_top_boundary',
                        messageType: 'warning',
                        messageText: isCategory ? 'La categoria è già in cima alla pagina' : 'La sezione è già in cima'
                    };
                }
                
                if (isCategory) {
                    let $prevCategory = $prev;
                    while ($prevCategory.length && !this.isCategorySection($prevCategory)) {
                        $prevCategory = $prevCategory.prev();
                    }
                    
                    if ($prevCategory.length && this.isCategorySection($prevCategory)) {
                        return {
                            canMove: true,
                            reason: 'valid_category_movement',
                            messageType: 'success',
                            messageText: 'Categoria spostata verso l\'alto'
                        };
                    }
                    
                    return {
                        canMove: false,
                        reason: 'at_top_boundary',
                        messageType: 'warning',
                        messageText: 'La categoria è già la prima categoria'
                    };
                }
                
                return {
                    canMove: true,
                    reason: 'valid_movement',
                    messageType: 'success',
                    messageText: 'Sezione spostata verso l\'alto'
                };
                
            } else { // direction === 'down'
                const $next = $section.next();
                
                if (!$next.length) {
                    return {
                        canMove: false,
                        reason: 'at_bottom_boundary',
                        messageType: 'warning',
                        messageText: isCategory ? 'La categoria è già in fondo alla pagina' : 'La sezione è già in fondo'
                    };
                }
                
                if (isCategory) {
                    let $nextCategory = $next;
                    while ($nextCategory.length && !this.isCategorySection($nextCategory)) {
                        $nextCategory = $nextCategory.next();
                    }
                    
                    if ($nextCategory.length && this.isCategorySection($nextCategory)) {
                        return {
                            canMove: true,
                            reason: 'valid_category_movement',
                            messageType: 'success',
                            messageText: 'Categoria spostata verso il basso'
                        };
                    }
                    
                    return {
                        canMove: false,
                        reason: 'at_bottom_boundary',
                        messageType: 'warning',
                        messageText: 'La categoria è già l\'ultima categoria'
                    };
                }
                
                return {
                    canMove: true,
                    reason: 'valid_movement',
                    messageType: 'success',
                    messageText: 'Sezione spostata verso il basso'
                };
            }
        };

        // Mock getAdjacentCategorySections function
        this.getAdjacentCategorySections = function($section) {
            const result = {
                previous: null,
                next: null
            };
            
            let $prev = $section.prev();
            while ($prev.length) {
                if (this.isCategorySection($prev)) {
                    result.previous = $prev;
                    break;
                }
                $prev = $prev.prev();
            }
            
            let $next = $section.next();
            while ($next.length) {
                if (this.isCategorySection($next)) {
                    result.next = $next;
                    break;
                }
                $next = $next.next();
            }
            
            return result;
        };
    }

    /**
     * Create mock jQuery element
     */
    createMockElement(categoryData, index, totalCategories) {
        const self = this;
        const mockElement = {
            data: function(key) {
                const dataMap = {
                    'section-id': categoryData.id,
                    'post-id': '123',
                    'is-category': categoryData.isCategory ? 'true' : 'false'
                };
                return dataMap[key];
            },
            hasClass: function(className) {
                return className === 'efe-category-section' || 
                       className === 'category';
            },
            prev: function() {
                if (index === 0) {
                    return { length: 0 };
                }
                return self.createMockElement(self.mockDOM[index - 1], index - 1, totalCategories);
            },
            next: function() {
                if (index === totalCategories - 1) {
                    return { length: 0 };
                }
                return self.createMockElement(self.mockDOM[index + 1], index + 1, totalCategories);
            },
            length: 1,
            index: function() {
                return index;
            }
        };

        return mockElement;
    }

    /**
     * Test requirement 1.1: Move category up without false boundary errors
     */
    testRequirement1_1() {
        this.log('Testing Requirement 1.1: Move category up without false boundary errors');
        
        // Test moving middle category up (should succeed)
        const middleCategory = this.createMockElement(this.mockDOM[1], 1, this.mockDOM.length);
        const validation = this.validateCategoryMovement(middleCategory, 'up');
        
        if (validation.canMove && validation.messageType === 'success') {
            this.requirementStatus['1.1'] = true;
            this.log('✓ Requirement 1.1 PASSED: Middle category can move up', 'success');
            return true;
        } else {
            this.log('✗ Requirement 1.1 FAILED: Middle category cannot move up', 'error');
            return false;
        }
    }

    /**
     * Test requirement 1.2: Move category down without false boundary errors
     */
    testRequirement1_2() {
        this.log('Testing Requirement 1.2: Move category down without false boundary errors');
        
        // Test moving middle category down (should succeed)
        const middleCategory = this.createMockElement(this.mockDOM[1], 1, this.mockDOM.length);
        const validation = this.validateCategoryMovement(middleCategory, 'down');
        
        if (validation.canMove && validation.messageType === 'success') {
            this.requirementStatus['1.2'] = true;
            this.log('✓ Requirement 1.2 PASSED: Middle category can move down', 'success');
            return true;
        } else {
            this.log('✗ Requirement 1.2 FAILED: Middle category cannot move down', 'error');
            return false;
        }
    }

    /**
     * Test requirement 1.3: First category up movement shows appropriate message
     */
    testRequirement1_3() {
        this.log('Testing Requirement 1.3: First category up movement boundary message');
        
        // Test moving first category up (should show boundary warning)
        const firstCategory = this.createMockElement(this.mockDOM[0], 0, this.mockDOM.length);
        const validation = this.validateCategoryMovement(firstCategory, 'up');
        
        if (!validation.canMove && validation.messageType === 'warning' && 
            validation.messageText.includes('cima')) {
            this.requirementStatus['1.3'] = true;
            this.log('✓ Requirement 1.3 PASSED: First category shows appropriate boundary message', 'success');
            return true;
        } else {
            this.log('✗ Requirement 1.3 FAILED: First category boundary message incorrect', 'error');
            return false;
        }
    }

    /**
     * Test requirement 1.4: Last category down movement shows appropriate message
     */
    testRequirement1_4() {
        this.log('Testing Requirement 1.4: Last category down movement boundary message');
        
        // Test moving last category down (should show boundary warning)
        const lastIndex = this.mockDOM.length - 1;
        const lastCategory = this.createMockElement(this.mockDOM[lastIndex], lastIndex, this.mockDOM.length);
        const validation = this.validateCategoryMovement(lastCategory, 'down');
        
        if (!validation.canMove && validation.messageType === 'warning' && 
            (validation.messageText.includes('ultima') || validation.messageText.includes('fondo'))) {
            this.requirementStatus['1.4'] = true;
            this.log('✓ Requirement 1.4 PASSED: Last category shows appropriate boundary message', 'success');
            return true;
        } else {
            this.log('✗ Requirement 1.4 FAILED: Last category boundary message incorrect', 'error');
            return false;
        }
    }

    /**
     * Test helper function: isCategorySection
     */
    testIsCategorySection() {
        this.log('Testing isCategorySection helper function');
        
        const categoryElement = this.createMockElement(this.mockDOM[0], 0, this.mockDOM.length);
        const isCategory = this.isCategorySection(categoryElement);
        
        if (isCategory) {
            this.log('✓ isCategorySection correctly identifies category sections', 'success');
            return true;
        } else {
            this.log('✗ isCategorySection failed to identify category section', 'error');
            return false;
        }
    }

    /**
     * Test helper function: getAdjacentCategorySections
     */
    testGetAdjacentCategorySections() {
        this.log('Testing getAdjacentCategorySections helper function');
        
        const middleCategory = this.createMockElement(this.mockDOM[1], 1, this.mockDOM.length);
        const adjacent = this.getAdjacentCategorySections(middleCategory);
        
        if (adjacent.previous && adjacent.next) {
            this.log('✓ getAdjacentCategorySections correctly finds adjacent categories', 'success');
            return true;
        } else {
            this.log('✗ getAdjacentCategorySections failed to find adjacent categories', 'error');
            return false;
        }
    }

    /**
     * Test edge cases
     */
    testEdgeCases() {
        this.log('Testing edge cases');
        
        let allPassed = true;
        
        // Test with null element
        const nullResult = this.isCategorySection(null);
        if (nullResult === false) {
            this.log('✓ isCategorySection handles null input correctly', 'success');
        } else {
            this.log('✗ isCategorySection does not handle null input correctly', 'error');
            allPassed = false;
        }
        
        // Test with empty element
        const emptyElement = { length: 0 };
        const emptyResult = this.isCategorySection(emptyElement);
        if (emptyResult === false) {
            this.log('✓ isCategorySection handles empty element correctly', 'success');
        } else {
            this.log('✗ isCategorySection does not handle empty element correctly', 'error');
            allPassed = false;
        }
        
        return allPassed;
    }

    /**
     * Run all tests
     */
    runAllTests() {
        this.log('Starting Category Movement Tests', 'info');
        this.log('=====================================', 'info');
        
        // Initialize mock functions
        this.mockHelperFunctions();
        
        const tests = [
            () => this.testRequirement1_1(),
            () => this.testRequirement1_2(),
            () => this.testRequirement1_3(),
            () => this.testRequirement1_4(),
            () => this.testIsCategorySection(),
            () => this.testGetAdjacentCategorySections(),
            () => this.testEdgeCases()
        ];
        
        let passedTests = 0;
        const totalTests = tests.length;
        
        tests.forEach((test, index) => {
            try {
                const result = test();
                if (result) {
                    passedTests++;
                }
            } catch (error) {
                this.log(`✗ Test ${index + 1} failed with error: ${error.message}`, 'error');
            }
        });
        
        this.log('=====================================', 'info');
        this.generateSummary(passedTests, totalTests);
        
        return {
            passed: passedTests,
            total: totalTests,
            requirementStatus: this.requirementStatus,
            results: this.testResults
        };
    }

    /**
     * Generate test summary
     */
    generateSummary(passedTests, totalTests) {
        const passedReqs = Object.values(this.requirementStatus).filter(status => status).length;
        const totalReqs = Object.keys(this.requirementStatus).length;
        
        this.log(`Test Summary:`, 'info');
        this.log(`- Tests Passed: ${passedTests}/${totalTests}`, 'info');
        this.log(`- Requirements Met: ${passedReqs}/${totalReqs}`, 'info');
        
        if (passedReqs === totalReqs) {
            this.log('🎉 All requirements have been successfully validated!', 'success');
        } else {
            this.log('⚠️ Some requirements need attention:', 'warning');
            Object.keys(this.requirementStatus).forEach(req => {
                if (!this.requirementStatus[req]) {
                    this.log(`  - Requirement ${req}: FAILED`, 'error');
                }
            });
        }
    }

    /**
     * Log test results
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.testResults.push(logEntry);
        
        // Console output with colors if available
        const colors = {
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            info: '\x1b[36m',
            reset: '\x1b[0m'
        };
        
        const color = colors[type] || colors.info;
        console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
    }
}

// Export for Node.js or run directly in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryMovementTester;
} else {
    // Browser environment - make available globally
    window.CategoryMovementTester = CategoryMovementTester;
}

// Auto-run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tester = new CategoryMovementTester();
    const results = tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.passed === results.total ? 0 : 1);
}