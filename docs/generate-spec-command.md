# Generate Spec Command

The `generate-spec` command analyzes projects in the extracted directory and generates comprehensive specifications following the spec-driven development template.

## Overview

This command provides automated specification generation for existing projects by:
- Analyzing project structure and file organization
- Extracting information from documentation (README files, etc.)
- Identifying programming languages and technologies used
- Parsing configuration files (package.json, tsconfig.json, etc.)
- Generating user scenarios and functional requirements
- Creating comprehensive specifications using the established template format

## Usage

### Basic Usage

```bash
# Analyze a specific project
specify generate-spec extracted/ai-opencog

# Analyze all projects in the extracted directory
specify generate-spec --all

# Specify custom output directory
specify generate-spec --all --output ./my-specs

# Use custom extracted directory path
specify generate-spec --all --extracted-dir ./my-projects
```

### Command Options

- `PROJECT_PATH` (optional): Path to specific project to analyze
- `--output, -o`: Output directory for generated specs (default: `./specs`)
- `--all`: Generate specs for all projects in extracted directory
- `--extracted-dir`: Path to extracted directory (default: `./extracted`)

## What Gets Analyzed

The analyzer examines:

### Project Structure
- Total file count and directory structure
- File types and programming languages used
- Key configuration files (package.json, tsconfig.json, Dockerfile, etc.)
- Main application entry points
- Test files and testing infrastructure

### Documentation
- README.md content analysis
- Project purpose and overview extraction
- Feature lists and capabilities
- Implementation notes from other documentation files

### Dependencies and Configuration
- NPM/Node.js dependencies (package.json)
- TypeScript configuration (tsconfig.json)
- Docker containerization setup
- Build scripts and development tools

### Code Analysis
- Programming languages used
- Main application files
- Test coverage
- Project complexity indicators

## Generated Specification Format

The generated specifications follow the standard spec-driven development template with:

### Auto-Generated Sections
- **Feature Name**: Derived from project name
- **User Scenarios**: Based on extracted project purpose and features
- **Functional Requirements**: Generated from technical analysis and documentation
- **Key Entities**: Identified from project structure and configuration

### Populated Content
- Project-specific user stories
- Technology-based requirements (languages, containerization, testing)
- Dependency requirements
- System architecture entities

## Example Output

For the `ai-opencog` project, the analyzer generates:

```markdown
# Feature Specification: ai-opencog - Comprehensive Implementation

**Feature Branch**: `spec-ai-opencog`  
**Created**: 2025-09-10  
**Status**: Draft  

## User Scenarios & Testing

### Primary User Story
As a developer, I want to use ai-opencog to provide world-class cognitive AI capabilities for integrating OpenCog into the Theia IDE platform...

## Requirements

### Functional Requirements
- **FR-001**: System MUST be implemented using JavaScript, TypeScript
- **FR-002**: System MUST support containerized deployment
- **FR-003**: System MUST integrate with required dependencies: @theia/ai-chat, @theia/ai-core, @theia/core...

### Key Entities
- **ai-opencog Package**: Main application package with version 1.64.0
- **Application Entry Points**: Core application files including src/common/index.ts...
- **Test Suite**: Automated testing components including 27 test files
```

## Error Handling

The command includes robust error handling for:
- Non-existent project paths
- Missing extracted directory
- Unreadable files or permissions issues
- Invalid project structures

## Integration with Spec-Driven Development

The generated specifications are designed to integrate seamlessly with the existing spec-driven development workflow:

1. **Generated specs** can be used as starting points for feature development
2. **Template format** ensures consistency with hand-written specifications
3. **Requirement structure** follows established FR-001, FR-002... numbering
4. **Review checklists** are included for quality assurance

## Best Practices

- Review and refine generated specifications before using them for development
- Use the generated specs as a foundation, adding project-specific details
- Validate functional requirements against actual project capabilities
- Update user scenarios to reflect real-world usage patterns
- Consider the generated specs as a starting point for stakeholder discussions