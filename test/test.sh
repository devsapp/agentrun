#!/bin/bash

# AgentRun Component Test Suite
# Enhanced version with canary deployment testing

set -o pipefail

# ==========================================
# 配置和常量
# ==========================================
VERSION="2.0.0"
TEST_START_TIME=$(date +%s)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# 测试结果统计
PASSED=0
FAILED=0
SKIPPED=0
TOTAL_TESTS=0

# 失败的测试列表
FAILED_TESTS=()

# 日志目录
LOG_DIR=".test-logs"
mkdir -p "$LOG_DIR"
TEST_LOG="$LOG_DIR/test-$(date +%Y%m%d-%H%M%S).log"

# ==========================================
# 日志函数
# ==========================================
log_info() {
    local msg="[INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
}

log_success() {
    local msg="[SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
    ((PASSED++))
}

log_error() {
    local msg="[ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
    ((FAILED++))
}

log_warning() {
    local msg="[WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
}

log_skip() {
    local msg="[SKIP] $1"
    echo -e "${CYAN}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
    ((SKIPPED++))
}

log_debug() {
    if [ "$DEBUG" == "true" ]; then
        local msg="[DEBUG] $1"
        echo -e "${MAGENTA}${msg}${NC}"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$TEST_LOG"
    fi
}

# ==========================================
# 辅助函数
# ==========================================
print_separator() {
    echo ""
    echo "=================================="
    echo "$1"
    echo "=================================="
    echo ""
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

print_scenario() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
}

wait_confirm() {
    if [ "$AUTO_MODE" != "true" ]; then
        echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
        read
    else
        sleep 1
    fi
}

get_duration() {
    local start=$1
    local end=$(date +%s)
    local duration=$((end - start))
    echo "${duration}s"
}

# ==========================================
# YAML 配置修改函数
# ==========================================
update_agent_description() {
    local new_description=$1
    log_info "Updating agent description to: $new_description"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/description: .*/description: \"$new_description\"/" s.yaml
    else
        sed -i "s/description: .*/description: \"$new_description\"/" s.yaml
    fi
    
    log_success "Description updated"
}

restore_original_config() {
    log_info "Restoring original configuration"
    
    if [ -f "s.yaml.backup" ]; then
        cp s.yaml.backup s.yaml
        log_success "Configuration restored from backup"
    else
        log_warning "No backup found, skipping restore"
    fi
}

# ==========================================
# 增强的测试函数
# ==========================================
test_command() {
    local test_name=$1
    local command=$2
    local allow_failure=${3:-""}
    local validate_func=${4:-""}
    
    ((TOTAL_TESTS++))
    
    print_separator "Testing: $test_name"
    
    local test_start=$(date +%s)
    local output
    local exit_code
    local log_file="$LOG_DIR/test-$TOTAL_TESTS-$(echo "$test_name" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').log"
    
    log_debug "Executing: $command"
    
    output=$(eval "$command" 2>&1 | tee "$log_file")
    exit_code=$?
    
    local duration=$(get_duration $test_start)
    
    if [ $exit_code -eq 0 ]; then
        if [ -n "$validate_func" ]; then
            if $validate_func "$output"; then
                log_success "$test_name passed (${duration})"
                return 0
            else
                log_error "$test_name validation failed (${duration})"
                FAILED_TESTS+=("$test_name")
                return 1
            fi
        else
            log_success "$test_name passed (${duration})"
            return 0
        fi
    else
        if [[ "$output" == *"does not exist"* ]] || \
           [[ "$output" == *"not found"* ]] || \
           [[ "$output" == *"OnDemandConfigNotFound"* ]] || \
           [[ "$output" == *"404"* ]]; then
            if [ "$allow_failure" == "optional" ]; then
                log_warning "$test_name: Resource not found (expected)"
                log_skip "$test_name skipped (${duration})"
                return 0
            fi
        fi
        
        log_error "$test_name failed (exit code: $exit_code, ${duration})"
        FAILED_TESTS+=("$test_name")
        
        if [ "$VERBOSE" == "true" ]; then
            echo -e "${RED}Error details:${NC}"
            echo "$output" | tail -20
        fi
        
        return 1
    fi
}

# ==========================================
# 验证函数
# ==========================================
validate_agent_deployed() {
    local output=$1
    if [[ "$output" == *"status: READY"* ]] || [[ "$output" == *"deployed successfully"* ]]; then
        return 0
    fi
    return 1
}

validate_version_published() {
    local output=$1
    if [[ "$output" == *"version:"* ]] && [[ "$output" == *"arn:"* ]]; then
        return 0
    fi
    return 1
}

validate_endpoint_exists() {
    local output=$1
    if [[ "$output" == *"url:"* ]] || [[ "$output" == *"endpoint"* ]]; then
        return 0
    fi
    return 1
}

validate_traffic_split() {
    local output=$1
    local expected_pattern=$2
    if [[ "$output" == *"$expected_pattern"* ]]; then
        return 0
    fi
    return 1
}

# ==========================================
# 主测试流程
# ==========================================
main() {
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE=true
                log_info "Running in automatic mode (no user prompts)"
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                log_info "Verbose mode enabled"
                shift
                ;;
            --debug)
                DEBUG=true
                log_info "Debug mode enabled"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --auto       Run in automatic mode (no prompts)"
                echo "  --verbose    Show detailed output"
                echo "  --debug      Show debug information"
                echo "  --help       Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    cd "$(dirname "$0")"
    
    print_header "AgentRun Component Test Suite v${VERSION}"
    
    log_info "Test log: $TEST_LOG"
    log_info "Start time: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 检查环境
    log_info "Checking prerequisites..."
    
    if ! command -v s &> /dev/null; then
        log_error "Serverless Devs CLI 's' not found. Please install it first."
        exit 1
    fi
    
    if [ ! -d "../dist" ]; then
        log_error "dist directory not found. Please run 'npm run build' first."
        exit 1
    fi
    
    if [ ! -f "s.yaml" ]; then
        log_error "s.yaml not found in current directory."
        exit 1
    fi
    
    # 备份原始配置
    cp s.yaml s.yaml.backup
    log_info "Original configuration backed up to s.yaml.backup"
    
    log_success "Environment check passed"
    wait_confirm
    
    # ==========================================
    # Phase 1: Initial Deployment
    # ==========================================
    print_header "Phase 1: Initial Deployment"
    
    test_command \
        "Deploy Agent Runtime (Initial)" \
        "s deploy -y" \
        "" \
        "validate_agent_deployed"
    wait_confirm
    
    test_command \
        "Get Agent Info" \
        "s info"
    wait_confirm
    
    # ==========================================
    # Phase 2: Version Management
    # ==========================================
    print_header "Phase 2: Version Management"
    
    test_command \
        "List Versions (initial)" \
        "s version list"
    wait_confirm
    
    # 发布版本 1
    print_scenario "Scenario: Publish Version 1 (Stable)"
    log_info "Publishing Version 1 as the initial stable version"
    
    test_command \
        "Publish Version 1" \
        "s version publish --description 'Version 1 - Initial stable release'" \
        "" \
        "validate_version_published"
    wait_confirm
    
    test_command \
        "Verify Version 1 Published" \
        "s version list"
    wait_confirm
    
    # 修改配置准备版本 2
    print_scenario "Scenario: Prepare Version 2 (New Features)"
    log_info "Modifying configuration for version 2 with new features"
    
    update_agent_description "Test agent runtime - Version 2 with enhanced capabilities"
    
    wait_confirm
    
    # 部署版本 2
    test_command \
        "Deploy Agent Runtime (Version 2 changes)" \
        "s deploy -y" \
        "" \
        "validate_agent_deployed"
    wait_confirm
    
    # 发布版本 2
    test_command \
        "Publish Version 2" \
        "s version publish --description 'Version 2 - Enhanced features for canary testing'" \
        "" \
        "validate_version_published"
    wait_confirm
    
    test_command \
        "List All Versions" \
        "s version list"
    wait_confirm
    
    # ==========================================
    # Phase 3: Endpoint Management
    # ==========================================
    print_header "Phase 3: Endpoint Management & Canary Deployment"
    
    test_command \
        "List Endpoints (initial)" \
        "s endpoint list"
    wait_confirm
    
    # ✅ Scenario 1: Production endpoint pointing to stable version 1
    print_scenario "Scenario 1: Production - 100% v1 (Stable)"
    log_info "Setting production endpoint to version 1 (100% traffic)"
    
    test_command \
        "Update Production Endpoint to v1" \
        "s endpoint publish --endpoint-name production --target-version 1 --description 'Production endpoint - Stable v1'"
    wait_confirm
    
    test_command \
        "Verify Production Endpoint" \
        "s endpoint get --endpoint-name production" \
        "" \
        "validate_endpoint_exists"
    wait_confirm
    
    # ✅ Scenario 2: Canary deployment - 10% traffic to v2
    print_scenario "Scenario 2: Canary - 90% v1, 10% v2"
    log_info "Creating canary endpoint with 10% traffic to version 2"
    log_info "Traffic split: 90% → v1 (stable), 10% → v2 (canary)"
    
    test_command \
        "Create Canary Endpoint (10% v2)" \
        "s endpoint publish --endpoint-name canary --target-version 1 --canary-version 2 --weight 0.1 --description 'Canary deployment - Initial 10% to v2'"
    wait_confirm
    
    test_command \
        "Verify Canary Endpoint (10%)" \
        "s endpoint get --endpoint-name canary" \
        "" \
        "validate_endpoint_exists"
    wait_confirm
    
    test_command \
        "List All Endpoints (after canary)" \
        "s endpoint list"
    wait_confirm
    
    # ✅ Scenario 3: Increase canary traffic to 30%
    print_scenario "Scenario 3: Canary - 70% v1, 30% v2"
    log_info "Increasing canary traffic to 30% (v2 performing well)"
    log_info "Traffic split: 70% → v1, 30% → v2"
    
    test_command \
        "Update Canary to 30% v2" \
        "s endpoint publish --endpoint-name canary --target-version 1 --canary-version 2 --weight 0.3 --description 'Canary deployment - Increased to 30% to v2'"
    wait_confirm
    
    test_command \
        "Verify Canary Update (30%)" \
        "s endpoint get --endpoint-name canary" \
        "" \
        "validate_endpoint_exists"
    wait_confirm
    
    # ✅ Scenario 4: Blue-Green deployment - 50/50 split
    print_scenario "Scenario 4: Blue-Green - 50% v1, 50% v2"
    log_info "Testing blue-green deployment with equal traffic split"
    log_info "Traffic split: 50% → v1, 50% → v2"
    
    test_command \
        "Update Canary to 50% v2 (Blue-Green)" \
        "s endpoint publish --endpoint-name canary --target-version 1 --canary-version 2 --weight 0.5 --description 'Blue-Green deployment - 50/50 split'"
    wait_confirm
    
    test_command \
        "Verify Blue-Green Split" \
        "s endpoint get --endpoint-name canary" \
        "" \
        "validate_endpoint_exists"
    wait_confirm
    
    # ✅ Scenario 5: Full cutover to v2
    print_scenario "Scenario 5: Full Cutover - 100% v2"
    log_info "Cutting over production to version 2 (canary successful)"
    log_info "Traffic split: 100% → v2"
    
    test_command \
        "Cutover Production to v2" \
        "s endpoint publish --endpoint-name production --target-version 2 --description 'Production endpoint - Cutover to v2'"
    wait_confirm
    
    test_command \
        "Verify Production Cutover" \
        "s endpoint get --endpoint-name production" \
        "" \
        "validate_endpoint_exists"
    wait_confirm
    
    test_command \
        "List All Endpoints (after cutover)" \
        "s endpoint list"
    wait_confirm
    
    # ==========================================
    # Phase 4: Runtime Operations
    # ==========================================
    print_header "Phase 4: Runtime Operations"
    
    test_command \
        "List Instances" \
        "s instance list"
    wait_confirm
    
    test_command \
        "Query Recent Logs" \
        "s logs"
    wait_confirm
    
    # 可选：实时日志测试
    if [ "$AUTO_MODE" != "true" ]; then
        print_separator "Real-time Logs Test (Optional)"
        log_info "Real-time logs test (will run for 5 seconds)"
        log_warning "You can manually trigger requests to see logs"
        sleep 2
        timeout 5s s logs --tail 2>/dev/null || true
        log_info "Real-time logs test completed"
        wait_confirm
    fi
    
    # ==========================================
    # Phase 5: Concurrency Management
    # ==========================================
    print_header "Phase 5: Concurrency Management"
    
    test_command \
        "Get Concurrency Config (initial)" \
        "s concurrency get" \
        "optional"
    wait_confirm
    
    test_command \
        "Set Reserved Concurrency (10)" \
        "s concurrency put --reserved-concurrency 10"
    wait_confirm
    
    test_command \
        "Verify Concurrency Config" \
        "s concurrency get"
    wait_confirm
    
    test_command \
        "Update Reserved Concurrency (20)" \
        "s concurrency put --reserved-concurrency 20"
    wait_confirm
    
    test_command \
        "Verify Updated Concurrency" \
        "s concurrency get"
    wait_confirm
    
    test_command \
        "Remove Concurrency Config" \
        "s concurrency remove -y"
    wait_confirm
    
    test_command \
        "Verify Concurrency Removed" \
        "s concurrency get" \
        "optional"
    wait_confirm
    
    # ==========================================
    # Phase 6: Edge Cases & Error Handling
    # ==========================================
    print_header "Phase 6: Edge Cases & Error Handling"
    
    # 测试无效的参数组合
    print_scenario "Testing Error Handling"
    
    log_info "Testing: weight without canary-version (should fail)"
    if s endpoint publish --endpoint-name test-invalid --weight 0.2 2>&1 | grep -q "canary-version is required"; then
        log_success "Correctly rejected: weight without canary-version"
    else
        log_error "Should reject: weight without canary-version"
    fi
    wait_confirm
    
    log_info "Testing: canary-version without weight (should fail)"
    if s endpoint publish --endpoint-name test-invalid --canary-version 1 2>&1 | grep -q "weight is required"; then
        log_success "Correctly rejected: canary-version without weight"
    else
        log_error "Should reject: canary-version without weight"
    fi
    wait_confirm
    
    # ==========================================
    # Phase 7: Cleanup
    # ==========================================
    print_header "Phase 7: Cleanup"
    
    test_command \
        "Remove Canary Endpoint" \
        "s endpoint remove --endpoint-name canary -y" \
        "optional"
    wait_confirm
    
    test_command \
        "Verify Canary Removed" \
        "s endpoint get --endpoint-name canary" \
        "optional"
    wait_confirm
    
    test_command \
        "List Endpoints (after cleanup)" \
        "s endpoint list"
    wait_confirm
    
    # 恢复原始配置
    print_separator "Restoring Original Configuration"
    restore_original_config
    wait_confirm
    
    # 重新部署原始配置
    test_command \
        "Deploy Agent Runtime (restore original)" \
        "s deploy -y" \
        "" \
        "validate_agent_deployed"
    wait_confirm
    
    # 最后测试 remove（可选）
    if [ "$AUTO_MODE" != "true" ]; then
        echo ""
        log_warning "Final test will REMOVE the agent runtime"
        echo -e "${YELLOW}Do you want to test remove? (y/N): ${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            test_command \
                "Remove Agent Runtime" \
                "s remove -y"
            
            rm -f s.yaml.backup
        else
            log_skip "Remove test skipped by user"
        fi
    else
        log_info "Auto mode: skipping remove test to preserve resources"
        log_skip "Remove test skipped (auto mode)"
    fi
    
    # ==========================================
    # Test Summary
    # ==========================================
    generate_report
}

# ==========================================
# 生成测试报告
# ==========================================
generate_report() {
    local test_end_time=$(date +%s)
    local total_duration=$((test_end_time - TEST_START_TIME))
    
    print_header "Test Summary"
    
    echo "Test Results:"
    echo "============================================"
    echo -e "${GREEN}✓ Passed:  $PASSED${NC}"
    echo -e "${RED}✗ Failed:  $FAILED${NC}"
    echo -e "${CYAN}⊘ Skipped: $SKIPPED${NC}"
    echo "--------------------------------------------"
    echo "  Total:   $TOTAL_TESTS tests"
    echo "  Duration: ${total_duration}s"
    echo "  Log file: $TEST_LOG"
    echo "============================================"
    
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗${NC} $test"
        done
    fi
    
    echo ""
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        local pass_rate=$((PASSED * 100 / TOTAL_TESTS))
        echo "Pass Rate: ${pass_rate}%"
    fi
    
    echo ""
    echo "Canary Deployment Scenarios Tested:"
    echo "  1. Production - 100% v1"
    echo "  2. Canary - 90% v1, 10% v2"
    echo "  3. Canary - 70% v1, 30% v2"
    echo "  4. Blue-Green - 50% v1, 50% v2"
    echo "  5. Full Cutover - 100% v2"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        log_success "All tests passed! 🎉"
        if [ $SKIPPED -gt 0 ]; then
            log_info "($SKIPPED optional tests skipped)"
        fi
        echo ""
        echo "🎉 Congratulations! Your AgentRun component is working correctly."
        echo ""
        echo "Key Features Tested:"
        echo "  ✓ Basic deployment and info queries"
        echo "  ✓ Version management (v1, v2)"
        echo "  ✓ Endpoint management with traffic splitting"
        echo "  ✓ Canary deployment (10% → 30% → 50%)"
        echo "  ✓ Blue-Green deployment"
        echo "  ✓ Full cutover to new version"
        echo "  ✓ Instance and log operations"
        echo "  ✓ Concurrency management"
        echo "  ✓ Error handling"
        
        if [ -f "s.yaml.backup" ]; then
            rm -f s.yaml.backup
            log_info "Backup file cleaned up"
        fi
        
        exit 0
    else
        log_error "$FAILED test(s) failed! 😞"
        echo ""
        echo "Troubleshooting tips:"
        echo "  1. Check the detailed logs: $TEST_LOG"
        echo "  2. Review failed test logs in: $LOG_DIR/"
        echo "  3. Verify your credentials and permissions"
        echo "  4. Check if the agent runtime is properly deployed: s info"
        echo "  5. Review the component logs in: ~/.s/logs/"
        echo "  6. Run with --verbose flag for detailed output: ./test.sh --verbose"
        echo "  7. Original config backup: s.yaml.backup"
        echo ""
        exit 1
    fi
}

# ==========================================
# 信号处理
# ==========================================
cleanup() {
    echo ""
    log_warning "Test interrupted by user"
    
    if [ -f "s.yaml.backup" ]; then
        log_info "Restoring original configuration..."
        cp s.yaml.backup s.yaml
        log_success "Configuration restored"
    fi
    
    generate_report
    exit 130
}

trap cleanup SIGINT SIGTERM

# ==========================================
# 执行主函数
# ==========================================
main "$@"