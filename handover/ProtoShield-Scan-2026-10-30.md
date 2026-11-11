# ProtoShield Security Analysis Report

**Analysis Timestamp:** 2026-10-30 14:05:59 UTC<br>
**Project:** esg-export<br>
**Scan ID:** 1793368770907262000<br>
**ProtoShield Version:** v0.17.2

# Security Analysis Report - Executive Summary

## Overview

The esg-export project is a comprehensive ESG (Environmental, Social, and Governance) reporting platform with a Python FastAPI backend and TypeScript/React frontend. This security scan analyzed 139 source files across the entire codebase, including backend services, frontend components, infrastructure-as-code, and test suites, to identify security vulnerabilities, compliance gaps, and infrastructure misconfigurations.

## Key Findings

### Critical Issues: 0

### High Severity Issues: 140

All 140 high-severity findings are related to missing Apache 2.0 license headers across the project. The project lacks a LICENSE file at the root level and all 139 source files are missing the required Apache 2.0 license header, representing a complete compliance gap with the project's licensing requirements.

### Medium Severity Issues: 42

Medium-severity findings include 6 CVE vulnerabilities in dependencies (idna, react-router, react-router-dom, @tiptap/core) and 36 infrastructure security misconfigurations identified by Checkov. The infrastructure issues span network security, encryption, logging, and container hardening across AWS resources.

### Low Severity Issues: 138

Low-severity findings consist of 137 instances of assert statements in Python test files (flagged by Bandit as B101) and 1 CVE vulnerability in esbuild. The assert statements in test code are standard practice and not a security concern.

## Summary by Tool


| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| [License Headers](#license-headers) | 0 | 140 | 0 | 0 | 0 | 0 |
| [Semgrep](#semgrep) | 0 | 0 | 0 | 0 | 0 | 0 |
| [Bandit](#bandit) | 0 | 0 | 0 | 137 | 0 | 0 |
| [CVE Scan](#cve-scan) | 0 | 0 | 6 | 1 | 0 | 0 |
| [Checkov](#checkov) | 0 | 0 | 36 | 0 | 0 | 0 |
| [Secrets](#secrets) | 0 | 0 | 0 | 0 | 0 | 0 |
| [IAM Least Privilege](#iam-least-privilege) | 0 | 0 | 0 | 0 | 0 | 0 |
## Recommendations by Priority

### Immediate Actions (Critical/High)

1. **Add Project-Level LICENSE File**: Create a LICENSE file in the project root containing the full Apache 2.0 license text to establish the project's licensing intent at the repository level.

2. **Add Apache 2.0 License Headers to All Source Files**: Add the Apache 2.0 license header to all 139 source files using appropriate comment syntax for each file type (Python, TypeScript/TSX, and shell scripts).

3. **Update Vulnerable Dependencies**: Upgrade the following packages to address CVE vulnerabilities:
   - idna: 3.9.0 → 3.15 (DoS vulnerability)
   - react-router: 6.30.4 → 7.18.0 (constructor injection and open redirect)
   - react-router-dom: 6.30.4 → 6.30.6 (open redirect and XSS)
   - @tiptap/core: 2.27.2 → 3.30.4 (prototype pollution)

4. **Implement Backend Dependency Lock File**: Generate and commit a lock file for backend dependencies using `pip-compile` or `uv pip compile` to pin exact versions and ensure reproducible deployments.

### Short-term Actions (Medium)

5. **Network Security Hardening**: Configure ALB to redirect HTTP to HTTPS, add security group descriptions, restrict ingress to specific CIDR blocks, and enforce TLS 1.2 minimum.

6. **Enable WAF Protection**: Attach AWS WAFv2 to both the ALB and CloudFront distribution to protect against common web exploits.

7. **Implement KMS Encryption**: Enable customer-managed KMS encryption for DynamoDB, ECR, CloudWatch logs, and S3 buckets.

8. **S3 Bucket Hardening**: Enable versioning, access logging, lifecycle policies, event notifications, and cross-region replication on all S3 buckets.

9. **Update esbuild**: Upgrade esbuild from 0.27.7 to 0.28.1 to address the Windows file read vulnerability.

### Long-term Improvements (Low)

10. **Automate License Header Compliance**: Integrate tools like `addlicense` into the CI/CD pipeline to automatically add headers to new files and prevent future non-compliance.

11. **Increase CloudWatch Log Retention**: Extend log retention from 14 days to 365 days (1 year) for compliance and audit requirements.

12. **Add Docker HEALTHCHECK**: Include HEALTHCHECK instruction in the backend Dockerfile for improved container orchestration.

13. **Enable CloudFront Logging**: Configure CloudFront to log access to an S3 bucket for traffic analysis and security monitoring.

14. **Implement Automated Dependency Scanning**: Set up Dependabot or Renovate for continuous dependency vulnerability monitoring and automated update proposals.

## Positive Findings

The following security scanners found zero issues in their respective domains:

- **Semgrep**: No code quality or security policy violations detected
- **Secrets**: No hardcoded credentials, API keys, or sensitive information exposed
- **IAM Least Privilege**: All IAM policies follow AWS best practices with proper resource scoping and minimal permissions

## Conclusion

The esg-export project demonstrates strong security practices in code quality, secrets management, and IAM configuration. However, immediate attention is required to address the licensing compliance gap (140 high-severity findings) and update vulnerable dependencies (6 medium-severity CVEs). Infrastructure security improvements are needed to harden network controls, implement encryption, and enable comprehensive logging across AWS resources.

---

---


## License Headers

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| license_headers | 0 | 140 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Compliance Summary

**Overall Compliance Rate:** 0.0% (0 of 139 files compliant)

The project has **zero compliance** with the Apache 2.0 license header requirement. All 139 source files scanned are missing the required Apache 2.0 license header.

**Key Findings:**
- **Files Scanned:** 139
- **Files with Compliant Header:** 0
- **Files Missing Header:** 139
- **Project-Level LICENSE File:** Missing

### High Severity Issues

#### Missing Project-Level LICENSE File

The project root does not contain a LICENSE file (checked for: LICENSE, LICENSE.txt, LICENSE.md, COPYING). This is a critical compliance gap as the project requires Apache 2.0 licensing.

#### Missing Apache 2.0 License Headers

All 139 source files are missing the required Apache 2.0 license header. This includes:

**Backend Python Files (9 files):**
- backend/admin_config.py
- backend/ai.py
- backend/auth.py
- backend/main.py
- backend/retrieval.py
- backend/routers/__init__.py
- backend/routers/api.py
- backend/store.py
- backend/tests/conftest.py
- backend/tests/test_admin.py
- backend/tests/test_ai.py
- backend/tests/test_api.py

**Shell Scripts (3 files):**
- deploy-frontend.sh
- scripts/smoke-prod.sh
- scripts/test-all.sh

**Frontend TypeScript/TSX Files (117 files):**

*E2E Test Files (10 files):*
- frontend/e2e/capture-directory.spec.ts
- frontend/e2e/capture-screens.spec.ts
- frontend/e2e/compliance.spec.ts
- frontend/e2e/dashboard-tasks.spec.ts
- frontend/e2e/editor.smoke.spec.ts
- frontend/e2e/evidence-export.spec.ts
- frontend/e2e/multireport-admin.spec.ts
- frontend/e2e/navigation.spec.ts
- frontend/e2e/stale-cache.spec.ts
- frontend/e2e/structure-sync.spec.ts
- frontend/e2e/track-changes.spec.ts
- frontend/e2e/workflow.spec.ts

*Configuration Files (3 files):*
- frontend/playwright.capture.config.ts
- frontend/playwright.config.ts
- frontend/vite.config.ts

*Main Application Files (1 file):*
- frontend/src/App.tsx
- frontend/src/index.tsx

*API Client Files (6 files):*
- frontend/src/api/LocalAdapter.ts
- frontend/src/api/RestAdapter.test.ts
- frontend/src/api/RestAdapter.ts
- frontend/src/api/adapters.contract.test.ts
- frontend/src/api/adminClient.test.ts
- frontend/src/api/adminClient.ts
- frontend/src/api/aiClient.test.ts
- frontend/src/api/aiClient.ts
- frontend/src/api/index.ts
- frontend/src/api/ports.ts

*Authentication Files (2 files):*
- frontend/src/auth/amplifyConfig.ts
- frontend/src/auth/useAuth.ts

*Component Files (68 files):*
- frontend/src/components/AdminView.tsx
- frontend/src/components/AiSuggestionsView.tsx
- frontend/src/components/AnalysisView.tsx
- frontend/src/components/ArchitectureView.tsx
- frontend/src/components/AuditView.tsx
- frontend/src/components/AuditorView.tsx
- frontend/src/components/BenchmarkingView.tsx
- frontend/src/components/ComplianceView.tsx
- frontend/src/components/ConsistencyCheckView.tsx
- frontend/src/components/DashboardView.tsx
- frontend/src/components/DatapointChecklistPanel.tsx
- frontend/src/components/DemoScriptView.tsx
- frontend/src/components/EditorView.tsx
- frontend/src/components/KnowledgeBaseView.tsx
- frontend/src/components/LandingView.tsx
- frontend/src/components/ParallelReportView.tsx
- frontend/src/components/PolicyInventoryView.tsx
- frontend/src/components/PreviousReportsView.tsx
- frontend/src/components/SendToDialog.tsx
- frontend/src/components/StructureAdminView.tsx
- frontend/src/components/UploadView.tsx
- frontend/src/components/UserGuideView.tsx
- frontend/src/components/editor/AiAssistantPanel.tsx
- frontend/src/components/editor/ApprovalPanel.tsx
- frontend/src/components/editor/ChangeTracker.tsx
- frontend/src/components/editor/CollapsibleCard.tsx
- frontend/src/components/editor/CommentsPanel.tsx
- frontend/src/components/editor/ConsolidatedSectionView.tsx
- frontend/src/components/editor/ContentEditor.tsx
- frontend/src/components/editor/ContentViewer.tsx
- frontend/src/components/editor/EvidencePanel.tsx
- frontend/src/components/editor/MddReferenceNode.tsx
- frontend/src/components/editor/RichContentEditor.tsx
- frontend/src/components/editor/RollForwardChecklist.tsx
- frontend/src/components/editor/RollForwardCompare.tsx
- frontend/src/components/editor/SectionSidebar.tsx
- frontend/src/components/editor/StandardTextPopup.tsx
- frontend/src/components/editor/SuggestingEditor.tsx
- frontend/src/components/editor/TableOfContentsView.tsx
- frontend/src/components/editor/VersionHistoryModal.tsx
- frontend/src/components/editor/richTextSerializer.ts
- frontend/src/components/editor/trackChanges.ts
- frontend/src/components/scoped/ScopedViews.tsx

*Context and Data Files (60+ files):*
- frontend/src/context/ReportContext.tsx
- frontend/src/data/aiEditor.ts
- frontend/src/data/aiProvenance.ts
- frontend/src/data/asrs.ts
- frontend/src/data/auditEvents.ts
- frontend/src/data/auditRelease.ts
- frontend/src/data/brand.ts
- frontend/src/data/comments.ts
- frontend/src/data/complianceMappings.ts
- frontend/src/data/consistencyChecks.ts
- frontend/src/data/datapointChecklist.ts
- frontend/src/data/directoryResolver.test.ts
- frontend/src/data/directoryResolver.ts
- frontend/src/data/editorApprovals.ts
- frontend/src/data/editorChanges.ts
- frontend/src/data/esgIndex.test.ts
- frontend/src/data/esgIndex.ts
- frontend/src/data/esrsRequirements.ts
- frontend/src/data/knowledgeBaseDocuments.ts
- frontend/src/data/localReports.test.ts
- frontend/src/data/localReports.ts
- frontend/src/data/peerBenchmarking.ts
- frontend/src/data/permissions-matrix.test.ts
- frontend/src/data/permissions.ts
- frontend/src/data/policyInventory.ts
- frontend/src/data/portfolio.test.ts
- frontend/src/data/portfolio.ts
- frontend/src/data/priorYearContent.ts
- frontend/src/data/reportData.ts
- frontend/src/data/reportSections.ts
- frontend/src/data/reports.ts
- frontend/src/data/rollForwardItems.ts
- frontend/src/data/sectionEvidence.ts
- frontend/src/data/sectionLocks.ts
- frontend/src/data/sectionVersions.ts
- frontend/src/data/sendTo.test.ts
- frontend/src/data/sendTo.ts
- frontend/src/data/standardText.ts
- frontend/src/data/structureStore.ts
- frontend/src/data/syntheticDirectory.ts
- frontend/src/data/tableOfContents.ts
- frontend/src/data/tableRegistry.ts
- frontend/src/data/upc.ts
- frontend/src/data/workflowRoles.ts
- frontend/src/data/workflowState.ts
- frontend/src/data/workflowStatus.ts

*Service and Utility Files (5 files):*
- frontend/src/services/apiClient.ts
- frontend/src/utils/exportCsv.ts
- frontend/src/utils/exportDocx.ts
- frontend/src/utils/exportPdf.ts
- frontend/src/utils/wordDiff.ts
- frontend/src/vite-env.d.ts

### Recommendations

1. **Add Project-Level LICENSE File**
   - Create a LICENSE file in the project root containing the full Apache 2.0 license text
   - This establishes the project's licensing intent at the repository level

2. **Add Apache 2.0 License Headers to All Source Files**
   - Add the Apache 2.0 license header to every source file currently missing it
   - Use appropriate comment syntax for each file type:
     - **Python files** (`.py`): Use `#` for comments
     - **TypeScript/TSX files** (`.ts`, `.tsx`): Use `/* */` for block comments
     - **Shell scripts** (`.sh`): Use `#` for comments
   
3. **Standard Apache 2.0 Header Format**
   
   For Python and Shell scripts:
   ```
   # Copyright [YEAR] [Your Organization]
   #
   # Licensed under the Apache License, Version 2.0 (the "License");
   # you may not use this file except in compliance with the License.
   # You may obtain a copy of the License at
   #
   #     http://www.apache.org/licenses/LICENSE-2.0
   #
   # Unless required by applicable law or agreed to in writing, software
   # distributed under the License is distributed on an "AS IS" BASIS,
   # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   # See the License for the specific language governing permissions and
   # limitations under the License.
   ```
   
   For TypeScript/TSX files:
   ```
   /*
    * Copyright [YEAR] [Your Organization]
    *
    * Licensed under the Apache License, Version 2.0 (the "License");
    * you may not use this file except in compliance with the License.
    * You may obtain a copy of the License at
    *
    *     http://www.apache.org/licenses/LICENSE-2.0
    *
    * Unless required by applicable law or agreed to in writing, software
    * distributed under the License is distributed on an "AS IS" BASIS,
    * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    * See the License for the specific language governing permissions and
    * limitations under the License.
    */
   ```

4. **Maintain Current Copyright Years**
   - Use the current year (or year of creation) in the copyright notice
   - Do not copy outdated years from other files

5. **Automate Compliance Going Forward**
   - Consider using tools like `addlicense` or similar to automatically add headers to new files
   - Integrate license header checks into your CI/CD pipeline to prevent future non-compliance

</details>

---


## Semgrep

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| semgrep | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Scan Summary

The Semgrep security analysis completed successfully with **no findings** detected across the scanned codebase.

**Scan Results:**
- Total Issues Found: 0
- Critical Issues: 0
- High Severity Issues: 0
- Medium Severity Issues: 0
- Low Severity Issues: 0
- Info Level Issues: 0
- Suppressed Issues: 0
- Scan Errors: 0

### Analysis

The codebase passed all Semgrep security checks. No security vulnerabilities, code quality issues, or policy violations were detected by the Semgrep rules that were executed.

### Recommendations

1. **Continue Security Monitoring**: Maintain regular Semgrep scans as part of your CI/CD pipeline to catch any new issues introduced in future commits.

2. **Review Rule Configuration**: Ensure that the Semgrep rules being used are appropriate for your project's security requirements and coding standards.

3. **Expand Coverage**: Consider enabling additional Semgrep rulesets if you haven't already, such as:
   - OWASP Top 10 rules
   - CWE-focused rules
   - Language-specific best practices

4. **Documentation**: Document your current Semgrep configuration and the rules being enforced for team reference.

</details>

### Suppression Analysis

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| semgrep_suppressions | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Finding Summary

After a comprehensive search of the project source code using deterministic pattern matching for Semgrep suppressions (`nosemgrep`, `# nosemgrep:`, `semgrep-disable`, `.semgrep.yml`, `.semgrep.yaml`, `semgrep.yml`), **no Semgrep-specific suppressions were found** in the codebase.

### Search Methodology

1. **Semgrep Suppression Markers**: Searched for `nosemgrep`, `# nosemgrep:`, and `semgrep-disable` patterns across all source files
2. **Configuration Files**: Checked for `.semgrep.yml`, `.semgrep.yaml`, and `semgrep.yml` configuration files
3. **Related Suppressions Found** (not Semgrep):
   - **Flake8/Pylint suppressions** (`# noqa: BLE001`): 5 instances in `backend/ai.py` for bare exception handling
   - **ESLint suppressions** (`// eslint-disable-next-line`): 1 instance in `frontend/src/components/EditorView.tsx` for React hooks exhaustive-deps

### Conclusion

The project does not currently use Semgrep suppressions. All code-level suppressions found are for other linters (Flake8, ESLint) and are not within the scope of this Semgrep suppression review.

### Recommendations

- If Semgrep is integrated into the CI/CD pipeline, consider establishing a suppression policy that requires:
  - Specific rule IDs (e.g., `# nosemgrep: python.lang.security.audit.unsafe-pickle`)
  - Documented justification for each suppression
  - Expiration dates or review intervals for temporary suppressions
  - Narrowly-scoped suppressions (line-level or function-level, not file-wide)

</details>

---


## Bandit

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| bandit | 0 | 0 | 0 | 137 | 0 | 0 |

<details>
<summary>View Details</summary>

### Low Severity Issues

**Rule: B101 - Use of assert detected**

The Bandit scan identified 137 instances of the `assert_used` rule (B101) across the test suite. This rule flags the use of Python's `assert` statement, which is removed when Python code is compiled to optimized byte code (with the `-O` flag).

**Affected Files/Locations:**

- `backend/tests/test_admin.py` - 24 instances (lines 11-107)
- `backend/tests/test_ai.py` - 79 instances (lines 15-312)
- `backend/tests/test_api.py` - 34 instances (lines 9-146)

**Context:**

All 137 findings are in test files using `assert` statements for test validation. Examples include:
- Assertions checking configuration values and API response status codes
- Assertions validating JSON response content
- Assertions verifying function return values and data structures

**CWE Reference:** CWE-703 (Improper Check or Handling of Exceptional Conditions)

### Recommendations

**For Test Code:**

The use of `assert` in test files is a common and acceptable practice in Python testing. However, consider the following:

1. **Use a Test Framework:** Replace raw `assert` statements with a dedicated testing framework like `pytest` or `unittest` that provides better assertion messages and test reporting. These frameworks use assertion rewriting to provide detailed failure information even in optimized mode.

2. **If Using pytest:** The current `assert` statements are compatible with pytest and will work correctly. Pytest's assertion rewriting ensures assertions work properly even with optimization flags.

3. **Avoid assert in Production Code:** Ensure that `assert` statements are only used in test files and development code, never in production code where they could be disabled.

4. **Suppress in Test Files:** If using Bandit in CI/CD, consider excluding test directories from Bandit scans or suppressing B101 warnings for test files, as this is a false positive for test code.

**Summary:**

All 137 low-severity findings are `assert` statements in test files, which is standard practice for Python testing. No security issues are present. The findings can be safely ignored or suppressed for test code.

</details>

---


## CVE Scan

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| cve | 0 | 0 | 6 | 1 | 0 | 0 |

<details>
<summary>View Details</summary>

### Medium Severity Issues

**CVE-2026-45409 (idna 3.9.0)**
- **Vulnerability**: Internationalized Domain Names in Applications (IDNA) Denial of Service
- **Description**: Payloads such as `"\u0660" * N` or `"\u30fb" * N + "\u6f22"` utilize the `valid_contexto` function prior to length rejection. For high values of N, this will consume significant resources and lead to denial-of-service. This is a bypass of the original CVE-2024-3651 remediation.
- **CVSS Score**: 6.9 (Medium)
- **Fixed Version**: 3.15
- **Remediation**: Upgrade idna to version 3.15 or later. As a workaround, enforce a 253-character length limit on domain names before passing them to `idna.encode()`.
- **Affected Files**: backend/requirements.txt

**CVE-2026-53666 (react-router 6.30.4)**
- **Vulnerability**: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration
- **Description**: The `deserializeErrors()` function in React Router's server-side rendering (SSR) hydration process allows arbitrary constructor injection, potentially leading to code execution or data manipulation.
- **CVSS Score**: 6.1 (Medium)
- **Fixed Version**: 7.18.0
- **CWE**: CWE-470 (Use of Externally-Controlled Input to Select Classes or Code)
- **Remediation**: Upgrade react-router to version 7.18.0 or later.
- **Affected Files**: frontend/package-lock.json

**CVE-2026-53668 (react-router-dom 6.30.4)**
- **Vulnerability**: Open Redirect Leading to XSS
- **Description**: React Router DOM contains an open redirect vulnerability that can lead to cross-site scripting (XSS) attacks through improper URL validation.
- **CVSS Score**: 6.9 (Medium)
- **Fixed Version**: 6.30.6
- **CWE**: CWE-601 (URL Redirection to Untrusted Site), CWE-79 (Improper Neutralization of Input During Web Page Generation)
- **Remediation**: Upgrade react-router-dom to version 6.30.6 or later.
- **Affected Files**: frontend/package-lock.json

**CVE-2026-53669 (react-router 6.30.4)**
- **Vulnerability**: Open Redirect via Backslash in `<Link>` and useNavigate (CVE-2025-68470 bypass)
- **Description**: React Router contains an open redirect vulnerability that can be exploited using backslash characters in `<Link>` components and `useNavigate()` calls, bypassing previous security fixes.
- **CVSS Score**: 5.1 (Medium)
- **Fixed Version**: 7.18.0
- **CWE**: CWE-601 (URL Redirection to Untrusted Site)
- **Remediation**: Upgrade react-router to version 7.18.0 or later.
- **Affected Files**: frontend/package-lock.json

**GHSA-cp6q-959q-f8rh (@tiptap/core 2.27.2)**
- **Vulnerability**: mergeAttributes() Prototype Pollution Leading to DOM Attribute Injection
- **Description**: The `mergeAttributes()` function in Tiptap improperly handles the `__proto__` key, allowing it to be converted into inherited executable DOM attributes. This can lead to prototype pollution and XSS attacks.
- **CVSS Score**: 6.4 (Medium)
- **Fixed Version**: 3.30.4
- **CWE**: CWE-1321 (Improperly Controlled Modification of Object Prototype Attributes), CWE-79 (Improper Neutralization of Input During Web Page Generation)
- **Remediation**: Upgrade @tiptap/core to version 3.30.4 or later.
- **Affected Files**: frontend/package-lock.json

**Unpinned Dependency Versions (backend/requirements.txt)**
- **Vulnerability**: 7 dependencies with no upper version bound
- **Description**: The following dependencies in backend/requirements.txt have no upper version constraints:
  - fastapi (>=0.120.0)
  - uvicorn (>=0.33.0)
  - PyJWT (>=2.15.0)
  - httpx (>=0.28.0)
  - boto3 (>=1.42.0)
  - anyio (>=4.14.2)
  - certifi (>=2026.10.19)
  
  This means the versions installed at deploy time are unconstrained, so the versions scanned here may not match what ships to production.
- **Remediation**: Pin exact versions or commit a compiled lock file (e.g., using `uv pip compile` or `pip-compile`) to ensure scans reflect the deployed dependency tree and enable reproducible builds.
- **Affected Files**: backend/requirements.txt

### Low Severity Issues

**GHSA-g7r4-m6w7-qqqr (esbuild 0.27.7)**
- **Vulnerability**: Arbitrary File Read on Windows Development Server
- **Description**: esbuild's development server on Windows allows arbitrary file read when running locally. This is a local privilege escalation vulnerability affecting Windows developers.
- **CVSS Score**: 2.5 (Low)
- **Fixed Version**: 0.28.1
- **CWE**: CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)
- **Remediation**: Upgrade esbuild to version 0.28.1 or later.
- **Affected Files**: frontend/package-lock.json

### Affected Packages

| Package | Current Version | Fixed Version | Severity | Location |
|---------|-----------------|---------------|----------|----------|
| idna | 3.9.0 | 3.15 | Medium | backend/requirements.txt |
| react-router | 6.30.4 | 7.18.0 | Medium | frontend/package-lock.json |
| react-router-dom | 6.30.4 | 6.30.6 | Medium | frontend/package-lock.json |
| @tiptap/core | 2.27.2 | 3.30.4 | Medium | frontend/package-lock.json |
| esbuild | 0.27.7 | 0.28.1 | Low | frontend/package-lock.json |

### Recommendations

1. **Immediate Actions (Medium Severity)**:
   - Update react-router and react-router-dom in the frontend to address multiple open redirect and constructor injection vulnerabilities
   - Update @tiptap/core to fix the prototype pollution vulnerability
   - Update idna in the backend to address the denial-of-service vulnerability

2. **Backend Dependency Management**:
   - Generate and commit a lock file for backend dependencies using `pip-compile` or `uv pip compile`
   - This will pin exact versions and ensure reproducible deployments
   - Pin upper version bounds for the 7 unconstrained dependencies to prevent unexpected breaking changes

3. **Frontend Updates**:
   - Update esbuild to 0.28.1 to address the Windows file read vulnerability (low priority but recommended)
   - Consider upgrading react-router to v7.18.0 for both react-router and react-router-dom to get all security fixes in one update

4. **Testing**:
   - After updating dependencies, run the full test suite to ensure compatibility
   - Pay special attention to routing behavior after react-router updates
   - Test rich text editor functionality after @tiptap/core updates

5. **Scanning**:
   - Implement automated dependency scanning in your CI/CD pipeline to catch vulnerabilities early
   - Consider using tools like Dependabot or Renovate for automated dependency updates

</details>

---


## Checkov

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| checkov | 0 | 0 | 36 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Medium Severity Issues

The Checkov scan identified 36 medium-severity infrastructure security issues across the AWS infrastructure and Docker configuration. These findings span multiple critical areas including network security, encryption, logging, and container hardening.

#### Network & Load Balancer Security (11 issues)

**ALB Security Group & Listener Configuration:**
- **CKV_AWS_23**: Security group rules lack descriptions (alb.tf, ecs.tf)
- **CKV_AWS_260**: ALB security group allows unrestricted HTTP ingress (0.0.0.0/0 to port 80)
- **CKV_AWS_382**: Security groups allow unrestricted egress to all ports (alb.tf, ecs.tf)
- **CKV2_AWS_20**: ALB does not redirect HTTP requests to HTTPS
- **CKV_AWS_2**: ALB listener protocol is HTTP instead of HTTPS
- **CKV_AWS_103**: ALB listener not configured with TLS 1.2 minimum
- **CKV_AWS_131**: ALB does not drop HTTP headers
- **CKV_AWS_150**: Load Balancer missing deletion protection
- **CKV_AWS_91**: ELBv2 access logging not enabled
- **CKV_AWS_378**: Load Balancer target group uses HTTP instead of HTTPS
- **CKV2_AWS_28**: Public-facing ALB not protected by WAF

**Affected Files:**
- infrastructure/alb.tf (lines 3-63)
- infrastructure/ecs.tf (lines 3-20)

#### CloudFront Distribution Security (6 issues)

- **CKV_AWS_68**: CloudFront distribution missing WAF protection
- **CKV2_AWS_32**: CloudFront missing response headers policy
- **CKV2_AWS_47**: CloudFront not configured with WAFv2 for Log4j vulnerability protection
- **CKV_AWS_310**: CloudFront missing origin failover configuration
- **CKV_AWS_374**: CloudFront missing geo-restriction configuration
- **CKV_AWS_86**: CloudFront distribution missing access logging

**Affected Files:**
- infrastructure/frontend.tf (lines 28-136)

#### S3 Bucket Security (13 issues)

**Frontend S3 Bucket:**
- **CKV2_AWS_61**: Missing lifecycle configuration
- **CKV2_AWS_62**: Missing event notifications
- **CKV_AWS_144**: Missing cross-region replication
- **CKV_AWS_145**: Not encrypted with KMS by default
- **CKV_AWS_18**: Missing access logging
- **CKV_AWS_21**: Versioning not enabled

**Knowledge Base S3 Bucket:**
- **CKV2_AWS_61**: Missing lifecycle configuration
- **CKV2_AWS_62**: Missing event notifications
- **CKV_AWS_144**: Missing cross-region replication
- **CKV_AWS_145**: Not encrypted with KMS by default
- **CKV_AWS_18**: Missing access logging

**Affected Files:**
- infrastructure/frontend.tf (lines 3-5)
- infrastructure/knowledge-base.tf (lines 38-41)

#### Database & Encryption (3 issues)

- **CKV_AWS_119**: DynamoDB table not encrypted with KMS Customer Managed CMK (dynamodb.tf, lines 3-20)
- **CKV_AWS_136**: ECR repository not encrypted with KMS (ecr.tf, lines 3-10)
- **CKV_AWS_51**: ECR image tags are mutable instead of immutable (ecr.tf, lines 3-10)

#### Logging & Retention (2 issues)

- **CKV_AWS_158**: CloudWatch log group not encrypted by KMS (ecs.tf, lines 30-33)
- **CKV_AWS_338**: CloudWatch log group retention too short (14 days vs required 1 year minimum) (ecs.tf, lines 30-33)

#### Container Security (1 issue)

- **CKV_DOCKER_2**: Docker image missing HEALTHCHECK instruction (backend/Dockerfile, lines 1-40)

### Recommendations

#### Immediate Priority (Network & Access Control)

1. **HTTP to HTTPS Redirection**: Add HTTP listener redirect rule to ALB to force HTTPS
2. **Security Group Descriptions**: Add descriptive names to all ingress/egress rules for audit compliance
3. **Restrict Ingress**: Limit HTTP/HTTPS ingress to specific CIDR blocks instead of 0.0.0.0/0
4. **Restrict Egress**: Replace unrestricted egress (0.0.0.0/0 to all ports) with specific destination rules
5. **TLS Configuration**: Update ALB listener to enforce TLS 1.2 minimum and drop HTTP headers

#### High Priority (Encryption & WAF)

6. **Enable WAF**: Attach AWS WAFv2 to both ALB and CloudFront distribution
7. **KMS Encryption**: 
   - Enable KMS encryption for DynamoDB table (use customer-managed CMK)
   - Enable KMS encryption for ECR repository
   - Enable KMS encryption for CloudWatch log groups
   - Enable KMS encryption for S3 buckets (frontend and knowledge-base)
8. **CloudFront Security**: Add response headers policy and configure geo-restrictions

#### Medium Priority (Data Protection & Logging)

9. **S3 Bucket Hardening**:
   - Enable versioning on all S3 buckets
   - Enable access logging to separate logging bucket
   - Add lifecycle policies for log retention and archival
   - Enable event notifications for audit trails
   - Enable cross-region replication for disaster recovery
10. **ECR Image Immutability**: Set `image_tag_mutability = "IMMUTABLE"` to prevent tag overwrites
11. **CloudWatch Retention**: Increase log retention from 14 days to 365 days (1 year)
12. **Load Balancer Protection**: Enable deletion protection on ALB

#### Low Priority (Container & Observability)

13. **Docker HEALTHCHECK**: Add HEALTHCHECK instruction to backend Dockerfile for container orchestration
14. **CloudFront Logging**: Enable access logging to S3 bucket for traffic analysis

### Summary

The infrastructure has significant security gaps primarily in:
- **Network isolation**: Overly permissive security groups and lack of WAF protection
- **Encryption**: Missing KMS encryption across multiple services
- **Logging & Monitoring**: Insufficient logging and short retention periods
- **Data Protection**: S3 buckets lack versioning, replication, and encryption

These issues should be addressed systematically, starting with network security and encryption controls, followed by logging and compliance configurations.

</details>

### Checkov Suppressions Analysis

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| checkov_suppressions | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Summary

No Checkov suppressions were found in the project source code.

### Search Methodology

A comprehensive search was conducted across the entire project to locate Checkov suppressions using the following markers and patterns:

1. **Inline suppression markers:**
   - `checkov:skip=`
   - `checkov.io/skip`
   - `skip=CKV`
   - `#checkov`

2. **Configuration files:**
   - `.checkov.yaml`
   - `.checkov.yml`
   - `checkov.yaml`
   - `checkov.yml`

3. **File types scanned:**
   - Terraform files (*.tf)
   - Python files (*.py)
   - TypeScript/JavaScript files (*.ts, *.tsx, *.js)
   - Configuration files (*.yaml, *.yml, *.json, *.ini, *.cfg, *.toml)
   - Dockerfile and infrastructure files
   - Shell scripts

### Findings

**Result:** No Checkov suppressions detected.

The project does not contain any inline Checkov suppressions or Checkov configuration files that would suppress findings. The infrastructure code in `infrastructure/` directory is written without suppressions, and the application code does not contain any Checkov-related suppression comments.

### Related Documentation

The project includes `docs/SECURITY-SCAN.md` which documents justified findings from a ProtoShield security scan (v0.17.2). These findings are documented in markdown format as part of the security scan record, not as inline code suppressions. The documented justified findings include:

- `aoss:APIAccessAll` on the Knowledge Base service role (kept by design, scoped to one collection)
- DynamoDB `Query` on the ECS task role (required for functionality)
- Bandit B101 `assert` findings (test code only)

These are architectural decisions documented for transparency, not Checkov suppressions in the source code.

### Conclusion

The project demonstrates good security practices by:
1. Not using blanket suppressions to hide findings
2. Documenting security decisions explicitly in the security scan record
3. Addressing security issues through proper architecture and least-privilege IAM policies

No suppression quality issues were identified because no suppressions exist in the codebase.

</details>

---


## Secrets

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| secrets | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Scan Summary

The Gitleaks secret scan completed successfully with **no secrets detected** in the project.

**Scan Results:**
- Total Findings: 0
- Scan Errors: 0
- Coverage: Complete

### Analysis

The scan found no hardcoded secrets, API keys, credentials, or other sensitive information in the codebase. This indicates that:

1. **No exposed credentials** - No API keys, tokens, or authentication credentials were found
2. **No database passwords** - No database connection strings or passwords detected
3. **No private keys** - No SSH keys, PGP keys, or other cryptographic material exposed
4. **No access tokens** - No OAuth tokens, JWT tokens, or similar authentication tokens found

### Recommendations

**Maintain Security Best Practices:**
- Continue to use environment variables and secure vaults for all sensitive configuration
- Implement pre-commit hooks with Gitleaks to prevent accidental secret commits
- Regularly rotate credentials and API keys
- Use `.gitignore` to exclude sensitive files from version control
- Consider implementing secret scanning in your CI/CD pipeline for ongoing monitoring

**Configuration:**
- Ensure `.env` files and similar configuration files are properly excluded from git
- Use `.gitignore` patterns to prevent accidental commits of sensitive data
- Document secret management practices for your development team

</details>

### Suppression Analysis

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| secrets_suppressions | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Findings

No Secrets suppressions were found in the project. A comprehensive search was performed for:

1. **Inline suppression markers**: `gitleaks:allow`, `gitleaks:ignore`, `gitleaks:skip`, `gitleaks:false-positive`
2. **Alternative suppression patterns**: `nosec`, `noqa.*secret`, `# pragma.*secret`
3. **Configuration files**: `.gitleaksignore`, `.gitleaks.toml`, `gitleaks.toml`, and other `.toml` files

**Result**: The project contains no Secrets suppressions to review.

### Conclusion

Since no suppressions exist, there are no questionable or acceptable suppressions to evaluate. The project either:
- Has not encountered any Secrets findings that required suppression, or
- Does not use Secrets scanning with suppressions

All severity counts are zero.

</details>

---


## IAM Least Privilege

| Tool | Critical | High | Medium | Low | Info | Suppressed |
|------|----------|------|--------|-----|------|------------|
| iam_least_privilege | 0 | 0 | 0 | 0 | 0 | 0 |

<details>
<summary>View Details</summary>

### Executive Summary

A comprehensive review of all IAM policies in the project infrastructure (Terraform files in `/infrastructure`) reveals **no least-privilege violations**. The project demonstrates security-conscious IAM design with properly scoped permissions, minimal use of managed policies, and clear alignment between infrastructure code and actual workload requirements.

### Policies Analyzed

#### 1. ECS Execution Role (`ecs_exec`)
- **File:** `infrastructure/ecs.tf:35-46`
- **Type:** AWS Managed Policy Attachment
- **Policy:** `arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy`
- **Assessment:** ✅ Least-privilege compliant. This is the standard AWS-provided execution role for ECS tasks, granting only permissions needed for container image pulls, log writes, and secret retrieval. This is a generated policy that cannot be tightened further.

#### 2. ECS Task Role (`ecs_task`)
- **File:** `infrastructure/ecs.tf:56-83`
- **Type:** Custom Inline Policy
- **Statements:**
  - **DynamoDB Access:** Actions `["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:Query"]` on `aws_dynamodb_table.main.arn`
    - ✅ Least-privilege compliant. Scoped to exactly four operations used by `backend/store.py`. Resource is the single table ARN. Comments confirm alignment with actual usage (get_item, put_item, delete_item, query_pk).
  - **Bedrock Invocation:** Actions `["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]` on `arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id}`
    - ✅ Least-privilege compliant. Scoped to the specific foundation model ARN (Claude 3 Haiku). Deliberately excludes `inference-profile/*` to keep permissions minimal for MVP. Comments explain this is intentional for cost/simplicity.

#### 3. Knowledge Base Service Role (`kb_role`)
- **File:** `infrastructure/knowledge-base.tf:105-135`
- **Type:** Custom Inline Policy (conditional, only created when `enable_knowledge_base = true`)
- **Assume Role Policy:** Scoped to `bedrock.amazonaws.com` with `aws:SourceAccount` condition
  - ✅ Least-privilege compliant. Properly restricted to Bedrock service with account condition.
- **Inline Policy Statements:**
  - **Bedrock Embedding:** Action `bedrock:InvokeModel` on `arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0`
    - ✅ Least-privilege compliant. Scoped to the specific embedding model used by the Knowledge Base.
  - **OpenSearch Serverless:** Action `aoss:APIAccessAll` on the collection ARN
    - ✅ Least-privilege compliant. While `aoss:APIAccessAll` appears broad, AWS documentation confirms this is the only IAM action available for OpenSearch Serverless data-plane access. Actual permissions are further scoped by the OpenSearch data-access policy (lines 95-101) which limits actions to specific index and collection operations. This is the documented pattern for Bedrock Knowledge Base service roles.
  - **S3 ListBucket:** Action `s3:ListBucket` on the raw-documents bucket with `aws:ResourceAccount` condition
    - ✅ Least-privilege compliant. Scoped to list operation on the specific bucket with account condition.
  - **S3 GetObject:** Action `s3:GetObject` on `${bucket}/*` with `aws:ResourceAccount` condition
    - ✅ Least-privilege compliant. Scoped to read operation on objects in the specific bucket with account condition.

#### 4. CloudFront Origin Access Identity (S3 Bucket Policy)
- **File:** `infrastructure/frontend.tf:143-149`
- **Type:** S3 Bucket Policy
- **Statement:** Action `s3:GetObject` on `${bucket}/*` for CloudFront OAI only
  - ✅ Least-privilege compliant. Scoped to read-only access for the specific CloudFront distribution's OAI. Bucket is blocked from public access.

#### 5. OpenSearch Serverless Data-Access Policy
- **File:** `infrastructure/knowledge-base.tf:95-101`
- **Type:** OpenSearch Serverless Data-Access Policy
- **Assessment:** ✅ Least-privilege compliant. Defines granular permissions for index and collection operations. Principals are limited to the KB service role and ECS task role. Permissions are specific: CreateIndex, DeleteIndex, UpdateIndex, DescribeIndex, ReadDocument, WriteDocument for indices; CreateCollectionItems, DeleteCollectionItems, UpdateCollectionItems, DescribeCollectionItems for collections.

### Key Findings

**No least-privilege violations detected.**

All IAM policies in this project follow AWS best practices:

1. **No Wildcard Actions:** No policies use `"Action": "*"` or `"service:*"` patterns.
2. **No Wildcard Resources:** No policies use `"Resource": "*"` on sensitive services (IAM, STS, KMS, S3, Secrets Manager).
3. **No Broad Managed Policies:** The only AWS managed policy attached is `AmazonECSTaskExecutionRolePolicy`, which is the standard, minimal execution role for ECS tasks.
4. **Proper Resource Scoping:** All custom policies are scoped to specific resources (table ARNs, model ARNs, bucket ARNs, collection ARNs).
5. **Conditions Applied:** Where applicable, conditions like `aws:SourceAccount` and `aws:ResourceAccount` are used to further restrict access.
6. **Code-Policy Alignment:** Inline policies match the actual AWS API calls made by the backend code:
   - DynamoDB policy matches `backend/store.py` usage (get_item, put_item, delete_item, query)
   - Bedrock policy matches `backend/ai.py` usage (InvokeModel, InvokeModelWithResponseStream)
   - Knowledge Base policy matches `backend/retrieval.py` usage (Retrieve, RetrieveAndGenerate)
7. **Disabled by Default:** Knowledge Base infrastructure is disabled by default (`enable_knowledge_base = false`), so the KB role is not created unless explicitly enabled.
8. **Well-Documented:** Comments in the code explain the rationale for permission choices (e.g., why inference-profile/* is excluded, why aoss:APIAccessAll is necessary, why specific DynamoDB actions are chosen).

### Recommendations

No changes required. The IAM configuration is well-designed and follows least-privilege principles. Continue this approach for any future IAM policies.

### Conclusion

This project demonstrates security-conscious IAM design. All policies are properly scoped, minimal, and aligned with actual workload requirements. No least-privilege violations were identified.

</details>

---

## Scanners Not Run

The following scanners were not run because they were not relevant to this project. This is an intentional selection decision, not a failure. Scanner failures, when they occur, are reported in each scanner's own detail section.

| Scanner | Reason |
|---------|--------|
| cdknag | no project files matched trigger patterns [cdk.json **/cdk.json] |
| cfnnag | no project files matched trigger patterns [*.template **/*.template template.json template.yaml] |
