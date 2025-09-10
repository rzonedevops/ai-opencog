#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "typer",
#     "rich",
#     "platformdirs",
#     "readchar",
#     "httpx",
# ]
# ///
"""
Specify CLI - Setup tool for Specify projects

Usage:
    uvx specify-cli.py init <project-name>
    uvx specify-cli.py init --here

Or install globally:
    uv tool install --from specify-cli.py specify-cli
    specify init <project-name>
    specify init --here
"""

import os
import subprocess
import sys
import zipfile
import tempfile
import shutil
import json
import re
from pathlib import Path
from typing import Optional, Dict, List, Any
from datetime import datetime

import typer
import httpx
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.text import Text
from rich.live import Live
from rich.align import Align
from rich.table import Table
from rich.tree import Tree
from typer.core import TyperGroup

# For cross-platform keyboard input
import readchar

# Constants
AI_CHOICES = {
    "copilot": "GitHub Copilot",
    "claude": "Claude Code",
    "gemini": "Gemini CLI"
}

# ASCII Art Banner
BANNER = """
███████╗██████╗ ███████╗ ██████╗██╗███████╗██╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝██║██╔════╝╚██╗ ██╔╝
███████╗██████╔╝█████╗  ██║     ██║█████╗   ╚████╔╝ 
╚════██║██╔═══╝ ██╔══╝  ██║     ██║██╔══╝    ╚██╔╝  
███████║██║     ███████╗╚██████╗██║██║        ██║   
╚══════╝╚═╝     ╚══════╝ ╚═════╝╚═╝╚═╝        ╚═╝   
"""

TAGLINE = "Spec-Driven Development Toolkit"
class StepTracker:
    """Track and render hierarchical steps without emojis, similar to Claude Code tree output.
    Supports live auto-refresh via an attached refresh callback.
    """
    def __init__(self, title: str):
        self.title = title
        self.steps = []  # list of dicts: {key, label, status, detail}
        self.status_order = {"pending": 0, "running": 1, "done": 2, "error": 3, "skipped": 4}
        self._refresh_cb = None  # callable to trigger UI refresh

    def attach_refresh(self, cb):
        self._refresh_cb = cb

    def add(self, key: str, label: str):
        if key not in [s["key"] for s in self.steps]:
            self.steps.append({"key": key, "label": label, "status": "pending", "detail": ""})
            self._maybe_refresh()

    def start(self, key: str, detail: str = ""):
        self._update(key, status="running", detail=detail)

    def complete(self, key: str, detail: str = ""):
        self._update(key, status="done", detail=detail)

    def error(self, key: str, detail: str = ""):
        self._update(key, status="error", detail=detail)

    def skip(self, key: str, detail: str = ""):
        self._update(key, status="skipped", detail=detail)

    def _update(self, key: str, status: str, detail: str):
        for s in self.steps:
            if s["key"] == key:
                s["status"] = status
                if detail:
                    s["detail"] = detail
                self._maybe_refresh()
                return
        # If not present, add it
        self.steps.append({"key": key, "label": key, "status": status, "detail": detail})
        self._maybe_refresh()

    def _maybe_refresh(self):
        if self._refresh_cb:
            try:
                self._refresh_cb()
            except Exception:
                pass

    def render(self):
        tree = Tree(f"[bold cyan]{self.title}[/bold cyan]", guide_style="grey50")
        for step in self.steps:
            label = step["label"]
            detail_text = step["detail"].strip() if step["detail"] else ""

            # Circles (unchanged styling)
            status = step["status"]
            if status == "done":
                symbol = "[green]●[/green]"
            elif status == "pending":
                symbol = "[green dim]○[/green dim]"
            elif status == "running":
                symbol = "[cyan]○[/cyan]"
            elif status == "error":
                symbol = "[red]●[/red]"
            elif status == "skipped":
                symbol = "[yellow]○[/yellow]"
            else:
                symbol = " "

            if status == "pending":
                # Entire line light gray (pending)
                if detail_text:
                    line = f"{symbol} [bright_black]{label} ({detail_text})[/bright_black]"
                else:
                    line = f"{symbol} [bright_black]{label}[/bright_black]"
            else:
                # Label white, detail (if any) light gray in parentheses
                if detail_text:
                    line = f"{symbol} [white]{label}[/white] [bright_black]({detail_text})[/bright_black]"
                else:
                    line = f"{symbol} [white]{label}[/white]"

            tree.add(line)
        return tree



MINI_BANNER = """
╔═╗╔═╗╔═╗╔═╗╦╔═╗╦ ╦
╚═╗╠═╝║╣ ║  ║╠╣ ╚╦╝
╚═╝╩  ╚═╝╚═╝╩╚   ╩ 
"""

def get_key():
    """Get a single keypress in a cross-platform way using readchar."""
    key = readchar.readkey()
    
    # Arrow keys
    if key == readchar.key.UP:
        return 'up'
    if key == readchar.key.DOWN:
        return 'down'
    
    # Enter/Return
    if key == readchar.key.ENTER:
        return 'enter'
    
    # Escape
    if key == readchar.key.ESC:
        return 'escape'
        
    # Ctrl+C
    if key == readchar.key.CTRL_C:
        raise KeyboardInterrupt

    return key



def select_with_arrows(options: dict, prompt_text: str = "Select an option", default_key: str = None) -> str:
    """
    Interactive selection using arrow keys with Rich Live display.
    
    Args:
        options: Dict with keys as option keys and values as descriptions
        prompt_text: Text to show above the options
        default_key: Default option key to start with
        
    Returns:
        Selected option key
    """
    option_keys = list(options.keys())
    if default_key and default_key in option_keys:
        selected_index = option_keys.index(default_key)
    else:
        selected_index = 0
    
    selected_key = None

    def create_selection_panel():
        """Create the selection panel with current selection highlighted."""
        table = Table.grid(padding=(0, 2))
        table.add_column(style="bright_cyan", justify="left", width=3)
        table.add_column(style="white", justify="left")
        
        for i, key in enumerate(option_keys):
            if i == selected_index:
                table.add_row("▶", f"[bright_cyan]{key}: {options[key]}[/bright_cyan]")
            else:
                table.add_row(" ", f"[white]{key}: {options[key]}[/white]")
        
        table.add_row("", "")
        table.add_row("", "[dim]Use ↑/↓ to navigate, Enter to select, Esc to cancel[/dim]")
        
        return Panel(
            table,
            title=f"[bold]{prompt_text}[/bold]",
            border_style="cyan",
            padding=(1, 2)
        )
    
    console.print()

    def run_selection_loop():
        nonlocal selected_key, selected_index
        with Live(create_selection_panel(), console=console, transient=True, auto_refresh=False) as live:
            while True:
                try:
                    key = get_key()
                    if key == 'up':
                        selected_index = (selected_index - 1) % len(option_keys)
                    elif key == 'down':
                        selected_index = (selected_index + 1) % len(option_keys)
                    elif key == 'enter':
                        selected_key = option_keys[selected_index]
                        break
                    elif key == 'escape':
                        console.print("\n[yellow]Selection cancelled[/yellow]")
                        raise typer.Exit(1)
                    
                    live.update(create_selection_panel(), refresh=True)

                except KeyboardInterrupt:
                    console.print("\n[yellow]Selection cancelled[/yellow]")
                    raise typer.Exit(1)

    run_selection_loop()

    if selected_key is None:
        console.print("\n[red]Selection failed.[/red]")
        raise typer.Exit(1)

    # Suppress explicit selection print; tracker / later logic will report consolidated status
    return selected_key



console = Console()


class ProjectAnalyzer:
    """Analyzes project structure and content to extract information for spec generation."""
    
    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.project_name = project_path.name
        self.analysis_data = {}
    
    def analyze(self) -> Dict[str, Any]:
        """Perform comprehensive analysis of the project."""
        console.print(f"[cyan]Analyzing project:[/cyan] {self.project_name}")
        
        self.analysis_data = {
            'name': self.project_name,
            'path': str(self.project_path),
            'structure': self._analyze_structure(),
            'documentation': self._analyze_documentation(),
            'configuration': self._analyze_configuration(),
            'code_files': self._analyze_code_files(),
            'dependencies': self._analyze_dependencies(),
            'features': self._extract_features(),
            'requirements': self._extract_requirements()
        }
        
        return self.analysis_data
    
    def _analyze_structure(self) -> Dict[str, Any]:
        """Analyze project directory structure."""
        structure = {
            'total_files': 0,
            'directories': [],
            'file_types': {},
            'key_files': []
        }
        
        for item in self.project_path.rglob('*'):
            if item.is_file():
                structure['total_files'] += 1
                suffix = item.suffix.lower()
                structure['file_types'][suffix] = structure['file_types'].get(suffix, 0) + 1
                
                # Identify key files
                if item.name.lower() in ['readme.md', 'package.json', 'tsconfig.json', 'dockerfile']:
                    structure['key_files'].append(str(item.relative_to(self.project_path)))
            elif item.is_dir():
                rel_path = str(item.relative_to(self.project_path))
                if rel_path and not rel_path.startswith('.'):
                    structure['directories'].append(rel_path)
        
        return structure
    
    def _analyze_documentation(self) -> Dict[str, Any]:
        """Analyze documentation files to extract project information."""
        docs = {
            'readme_content': '',
            'summary': '',
            'purpose': '',
            'features': [],
            'implementation_notes': []
        }
        
        # Look for README files
        readme_files = list(self.project_path.glob('README.md')) + list(self.project_path.glob('readme.md'))
        if readme_files:
            try:
                with open(readme_files[0], 'r', encoding='utf-8') as f:
                    docs['readme_content'] = f.read()
                    docs['summary'] = self._extract_summary_from_readme(docs['readme_content'])
                    docs['purpose'] = self._extract_purpose_from_readme(docs['readme_content'])
                    docs['features'] = self._extract_features_from_readme(docs['readme_content'])
            except Exception as e:
                console.print(f"[yellow]Warning: Could not read README: {e}[/yellow]")
        
        # Look for other documentation files
        doc_patterns = ['*.md', '*_SUMMARY.md', '*_GUIDE.md', '*_README.md']
        for pattern in doc_patterns:
            for doc_file in self.project_path.glob(pattern):
                if doc_file.name != 'README.md':
                    try:
                        with open(doc_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            docs['implementation_notes'].append({
                                'file': doc_file.name,
                                'content_preview': content[:500] + '...' if len(content) > 500 else content
                            })
                    except Exception:
                        pass
        
        return docs
    
    def _extract_summary_from_readme(self, content: str) -> str:
        """Extract a summary from README content."""
        lines = content.split('\n')
        summary_lines = []
        
        # Look for the first few paragraphs after the title
        found_title = False
        for line in lines:
            line = line.strip()
            if line.startswith('#') and not found_title:
                found_title = True
                continue
            elif found_title and line and not line.startswith('#'):
                summary_lines.append(line)
                if len(summary_lines) >= 3:  # Get first few descriptive lines
                    break
            elif found_title and line.startswith('#'):
                break
        
        return ' '.join(summary_lines)
    
    def _extract_purpose_from_readme(self, content: str) -> str:
        """Extract the purpose/overview from README content."""
        # Look for sections like "Overview", "Purpose", "Description"
        sections = re.split(r'\n#+\s+', content)
        for section in sections:
            if re.match(r'(overview|purpose|description|about)', section.lower()):
                lines = section.split('\n')[1:4]  # Skip the header, take next few lines
                return ' '.join(line.strip() for line in lines if line.strip())
        
        # Fallback to summary
        return self._extract_summary_from_readme(content)
    
    def _extract_features_from_readme(self, content: str) -> List[str]:
        """Extract features list from README content."""
        features = []
        lines = content.split('\n')
        in_features_section = False
        
        for line in lines:
            line = line.strip()
            
            # Look for features section
            if re.match(r'#+\s*(features|capabilities|functionality)', line.lower()):
                in_features_section = True
                continue
            elif in_features_section and line.startswith('#'):
                break
            elif in_features_section:
                # Extract bullet points or numbered lists
                if re.match(r'^[-*+]\s+\*\*(.+?)\*\*:', line):
                    # Format: - **Feature**: description
                    match = re.match(r'^[-*+]\s+\*\*(.+?)\*\*:', line)
                    if match:
                        features.append(match.group(1))
                elif re.match(r'^[-*+]\s+(.+)', line):
                    # Format: - Feature description
                    match = re.match(r'^[-*+]\s+(.+)', line)
                    if match:
                        features.append(match.group(1))
        
        return features
    
    def _analyze_configuration(self) -> Dict[str, Any]:
        """Analyze configuration files."""
        config = {
            'package_json': None,
            'tsconfig': None,
            'docker': False,
            'scripts': []
        }
        
        # Analyze package.json
        package_json_path = self.project_path / 'package.json'
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r') as f:
                    config['package_json'] = json.load(f)
                    if 'scripts' in config['package_json']:
                        config['scripts'] = list(config['package_json']['scripts'].keys())
            except Exception:
                pass
        
        # Check for TypeScript config
        tsconfig_path = self.project_path / 'tsconfig.json'
        if tsconfig_path.exists():
            try:
                with open(tsconfig_path, 'r') as f:
                    config['tsconfig'] = json.load(f)
            except Exception:
                config['tsconfig'] = True
        
        # Check for Docker
        config['docker'] = (self.project_path / 'Dockerfile').exists() or (self.project_path / 'docker-compose.yml').exists()
        
        return config
    
    def _analyze_code_files(self) -> Dict[str, Any]:
        """Analyze code files to understand functionality."""
        code_info = {
            'languages': set(),
            'file_count': 0,
            'main_files': [],
            'test_files': []
        }
        
        language_map = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript', 
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C'
        }
        
        for file_path in self.project_path.rglob('*'):
            if file_path.is_file():
                suffix = file_path.suffix.lower()
                if suffix in language_map:
                    code_info['languages'].add(language_map[suffix])
                    code_info['file_count'] += 1
                    
                    # Identify main and test files
                    if 'test' in file_path.name.lower() or 'spec' in file_path.name.lower():
                        code_info['test_files'].append(str(file_path.relative_to(self.project_path)))
                    elif file_path.name.lower() in ['index.js', 'index.ts', 'main.py', 'app.py', 'main.js']:
                        code_info['main_files'].append(str(file_path.relative_to(self.project_path)))
        
        code_info['languages'] = list(code_info['languages'])
        return code_info
    
    def _analyze_dependencies(self) -> Dict[str, Any]:
        """Analyze project dependencies."""
        deps = {
            'npm_dependencies': [],
            'dev_dependencies': [],
            'python_dependencies': []
        }
        
        # NPM dependencies
        package_json_path = self.project_path / 'package.json'
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r') as f:
                    package_data = json.load(f)
                    if 'dependencies' in package_data:
                        deps['npm_dependencies'] = list(package_data['dependencies'].keys())
                    if 'devDependencies' in package_data:
                        deps['dev_dependencies'] = list(package_data['devDependencies'].keys())
            except Exception:
                pass
        
        # Python dependencies
        requirements_files = ['requirements.txt', 'pyproject.toml', 'setup.py']
        for req_file in requirements_files:
            req_path = self.project_path / req_file
            if req_path.exists():
                deps['python_dependencies'].append(f"Found {req_file}")
                break
        
        return deps
    
    def _extract_features(self) -> List[str]:
        """Extract high-level features from analysis."""
        features = []
        
        # Features from documentation
        if self.analysis_data.get('documentation', {}).get('features'):
            features.extend(self.analysis_data['documentation']['features'])
        
        # Features inferred from structure
        if self.analysis_data.get('configuration', {}).get('docker'):
            features.append("Containerized deployment with Docker")
        
        if self.analysis_data.get('code_files', {}).get('test_files'):
            features.append("Automated testing capabilities")
        
        if self.analysis_data.get('configuration', {}).get('scripts'):
            features.append("Build and development scripts")
        
        return features
    
    def _extract_requirements(self) -> List[str]:
        """Extract functional requirements from analysis."""
        requirements = []
        
        # Infer requirements from features and documentation
        if 'api' in self.analysis_data.get('documentation', {}).get('readme_content', '').lower():
            requirements.append("System MUST provide API endpoints for external integration")
        
        if self.analysis_data.get('code_files', {}).get('test_files'):
            requirements.append("System MUST include comprehensive test coverage")
        
        if self.analysis_data.get('configuration', {}).get('docker'):
            requirements.append("System MUST support containerized deployment")
        
        return requirements


class SpecGenerator:
    """Generates comprehensive specifications using the analysis data."""
    
    def __init__(self, template_path: Optional[Path] = None):
        self.template_path = template_path
        if not template_path:
            # Default to the template in the repo
            self.template_path = Path(__file__).parent.parent.parent / "templates" / "spec-template.md"
    
    def generate_spec(self, analysis_data: Dict[str, Any]) -> str:
        """Generate a comprehensive spec based on analysis data."""
        spec_content = self._load_template()
        
        # Replace template placeholders with actual data
        replacements = {
            '[FEATURE NAME]': f"{analysis_data['name']} - Comprehensive Implementation",
            '[###-feature-name]': f"spec-{analysis_data['name'].lower().replace('_', '-').replace(' ', '-')}",
            '[DATE]': datetime.now().strftime("%Y-%m-%d"),
            '$ARGUMENTS': analysis_data.get('documentation', {}).get('summary', 'Analyzed from extracted project')
        }
        
        for placeholder, replacement in replacements.items():
            spec_content = spec_content.replace(placeholder, replacement)
        
        # Add project-specific content
        spec_content = self._populate_user_scenarios(spec_content, analysis_data)
        spec_content = self._populate_requirements(spec_content, analysis_data)
        spec_content = self._populate_entities(spec_content, analysis_data)
        
        return spec_content
    
    def _load_template(self) -> str:
        """Load the spec template."""
        try:
            with open(self.template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            console.print(f"[red]Error loading template: {e}[/red]")
            return self._default_template()
    
    def _default_template(self) -> str:
        """Provide a basic template if the file can't be loaded."""
        return """# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Generated from Analysis  
**Input**: $ARGUMENTS

## User Scenarios & Testing

### Primary User Story
[Generated from project analysis]

### Acceptance Scenarios
[Generated based on project features]

## Requirements

### Functional Requirements
[Generated from project analysis]

### Key Entities
[Generated from project structure]
"""
    
    def _populate_user_scenarios(self, spec_content: str, analysis_data: Dict[str, Any]) -> str:
        """Populate user scenarios based on analysis."""
        purpose = analysis_data.get('documentation', {}).get('purpose', '')
        features = analysis_data.get('documentation', {}).get('features', [])
        
        user_story = f"As a developer, I want to use {analysis_data['name']} to {purpose.lower() if purpose else 'accomplish project goals'}"
        
        scenarios = []
        for i, feature in enumerate(features[:3], 1):  # Limit to top 3 features
            scenarios.append(f"{i}. **Given** the system is running, **When** user {feature.lower()}, **Then** the system should respond appropriately")
        
        if not scenarios:
            scenarios = ["1. **Given** the system is initialized, **When** user interacts with the system, **Then** expected functionality is provided"]
        
        # Find and replace the primary user story placeholder
        spec_content = re.sub(
            r'\[Describe the main user journey in plain language\]',
            user_story,
            spec_content
        )
        
        # Find and replace the acceptance scenarios
        spec_content = re.sub(
            r'1\. \*\*Given\*\* \[initial state\], \*\*When\*\* \[action\], \*\*Then\*\* \[expected outcome\]\n2\. \*\*Given\*\* \[initial state\], \*\*When\*\* \[action\], \*\*Then\*\* \[expected outcome\]',
            '\n'.join(scenarios),
            spec_content
        )
        
        return spec_content
    
    def _populate_requirements(self, spec_content: str, analysis_data: Dict[str, Any]) -> str:
        """Populate functional requirements based on analysis."""
        requirements = []
        req_num = 1
        
        # Add requirements from analysis
        for req in analysis_data.get('requirements', []):
            requirements.append(f"- **FR-{req_num:03d}**: {req}")
            req_num += 1
        
        # Add requirements based on technical stack
        languages = analysis_data.get('code_files', {}).get('languages', [])
        if languages:
            requirements.append(f"- **FR-{req_num:03d}**: System MUST be implemented using {', '.join(languages)}")
            req_num += 1
        
        if analysis_data.get('configuration', {}).get('docker'):
            requirements.append(f"- **FR-{req_num:03d}**: System MUST support containerized deployment")
            req_num += 1
        
        dependencies = analysis_data.get('dependencies', {}).get('npm_dependencies', [])
        if dependencies:
            requirements.append(f"- **FR-{req_num:03d}**: System MUST integrate with required dependencies: {', '.join(dependencies[:5])}")
        
        if not requirements:
            requirements.append("- **FR-001**: System MUST provide core functionality as defined in project documentation")
        
        # Replace the functional requirements section, removing template examples
        requirements_text = '\n'.join(requirements)
        
        # Replace the template requirements with our generated ones
        spec_content = re.sub(
            r'### Functional Requirements\n- \*\*FR-001\*\*:.*?(?=\n\*Example|\n### Key Entities|\Z)',
            f'### Functional Requirements\n{requirements_text}\n\n',
            spec_content,
            flags=re.DOTALL
        )
        
        return spec_content
    
    def _populate_entities(self, spec_content: str, analysis_data: Dict[str, Any]) -> str:
        """Populate key entities based on analysis."""
        entities = []
        
        # Extract entities from configuration
        package_json = analysis_data.get('configuration', {}).get('package_json')
        if package_json:
            entities.append(f"- **{analysis_data['name']} Package**: Main application package with version {package_json.get('version', 'unspecified')}")
        
        # Add entities based on file structure
        main_files = analysis_data.get('code_files', {}).get('main_files', [])
        if main_files:
            entities.append(f"- **Application Entry Points**: Core application files including {', '.join(main_files)}")
        
        test_files = analysis_data.get('code_files', {}).get('test_files', [])
        if test_files:
            entities.append(f"- **Test Suite**: Automated testing components including {len(test_files)} test files")
        
        if not entities:
            entities.append("- **System Core**: Main application components and data structures")
        
        entities_text = '\n'.join(entities)
        
        # Replace the entities section - find the template pattern and replace
        spec_content = re.sub(
            r'### Key Entities.*?\n- \*\*\[Entity 1\]\*\*:.*?(?=\n---|\n\#|\Z)',
            f'### Key Entities\n{entities_text}',
            spec_content,
            flags=re.DOTALL
        )
        
        return spec_content


class BannerGroup(TyperGroup):
    """Custom group that shows banner before help."""
    
    def format_help(self, ctx, formatter):
        # Show banner before help
        show_banner()
        super().format_help(ctx, formatter)


app = typer.Typer(
    name="specify",
    help="Setup tool for Specify spec-driven development projects",
    add_completion=False,
    invoke_without_command=True,
    cls=BannerGroup,
)


def show_banner():
    """Display the ASCII art banner."""
    # Create gradient effect with different colors
    banner_lines = BANNER.strip().split('\n')
    colors = ["bright_blue", "blue", "cyan", "bright_cyan", "white", "bright_white"]
    
    styled_banner = Text()
    for i, line in enumerate(banner_lines):
        color = colors[i % len(colors)]
        styled_banner.append(line + "\n", style=color)
    
    console.print(Align.center(styled_banner))
    console.print(Align.center(Text(TAGLINE, style="italic bright_yellow")))
    console.print()


@app.callback()
def callback(ctx: typer.Context):
    """Show banner when no subcommand is provided."""
    # Show banner only when no subcommand and no help flag
    # (help is handled by BannerGroup)
    if ctx.invoked_subcommand is None and "--help" not in sys.argv and "-h" not in sys.argv:
        show_banner()
        console.print(Align.center("[dim]Run 'specify --help' for usage information[/dim]"))
        console.print()


def run_command(cmd: list[str], check_return: bool = True, capture: bool = False, shell: bool = False) -> Optional[str]:
    """Run a shell command and optionally capture output."""
    try:
        if capture:
            result = subprocess.run(cmd, check=check_return, capture_output=True, text=True, shell=shell)
            return result.stdout.strip()
        else:
            subprocess.run(cmd, check=check_return, shell=shell)
            return None
    except subprocess.CalledProcessError as e:
        if check_return:
            console.print(f"[red]Error running command:[/red] {' '.join(cmd)}")
            console.print(f"[red]Exit code:[/red] {e.returncode}")
            if hasattr(e, 'stderr') and e.stderr:
                console.print(f"[red]Error output:[/red] {e.stderr}")
            raise
        return None


def check_tool(tool: str, install_hint: str) -> bool:
    """Check if a tool is installed."""
    if shutil.which(tool):
        return True
    else:
        console.print(f"[yellow]⚠️  {tool} not found[/yellow]")
        console.print(f"   Install with: [cyan]{install_hint}[/cyan]")
        return False


def is_git_repo(path: Path = None) -> bool:
    """Check if the specified path is inside a git repository."""
    if path is None:
        path = Path.cwd()
    
    if not path.is_dir():
        return False

    try:
        # Use git command to check if inside a work tree
        subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            check=True,
            capture_output=True,
            cwd=path,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def init_git_repo(project_path: Path, quiet: bool = False) -> bool:
    """Initialize a git repository in the specified path.
    quiet: if True suppress console output (tracker handles status)
    """
    try:
        original_cwd = Path.cwd()
        os.chdir(project_path)
        if not quiet:
            console.print("[cyan]Initializing git repository...[/cyan]")
        subprocess.run(["git", "init"], check=True, capture_output=True)
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "Initial commit from Specify template"], check=True, capture_output=True)
        if not quiet:
            console.print("[green]✓[/green] Git repository initialized")
        return True
        
    except subprocess.CalledProcessError as e:
        if not quiet:
            console.print(f"[red]Error initializing git repository:[/red] {e}")
        return False
    finally:
        os.chdir(original_cwd)


def download_template_from_github(ai_assistant: str, download_dir: Path, *, verbose: bool = True, show_progress: bool = True):
    """Download the latest template release from GitHub using HTTP requests.
    Returns (zip_path, metadata_dict)
    """
    repo_owner = "github"
    repo_name = "spec-kit"
    
    if verbose:
        console.print("[cyan]Fetching latest release information...[/cyan]")
    api_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/releases/latest"
    
    try:
        response = httpx.get(api_url, timeout=30, follow_redirects=True)
        response.raise_for_status()
        release_data = response.json()
    except httpx.RequestError as e:
        if verbose:
            console.print(f"[red]Error fetching release information:[/red] {e}")
        raise typer.Exit(1)
    
    # Find the template asset for the specified AI assistant
    pattern = f"spec-kit-template-{ai_assistant}"
    matching_assets = [
        asset for asset in release_data.get("assets", [])
        if pattern in asset["name"] and asset["name"].endswith(".zip")
    ]
    
    if not matching_assets:
        if verbose:
            console.print(f"[red]Error:[/red] No template found for AI assistant '{ai_assistant}'")
            console.print(f"[yellow]Available assets:[/yellow]")
            for asset in release_data.get("assets", []):
                console.print(f"  - {asset['name']}")
        raise typer.Exit(1)
    
    # Use the first matching asset
    asset = matching_assets[0]
    download_url = asset["browser_download_url"]
    filename = asset["name"]
    file_size = asset["size"]
    
    if verbose:
        console.print(f"[cyan]Found template:[/cyan] {filename}")
        console.print(f"[cyan]Size:[/cyan] {file_size:,} bytes")
        console.print(f"[cyan]Release:[/cyan] {release_data['tag_name']}")
    
    # Download the file
    zip_path = download_dir / filename
    if verbose:
        console.print(f"[cyan]Downloading template...[/cyan]")
    
    try:
        with httpx.stream("GET", download_url, timeout=30, follow_redirects=True) as response:
            response.raise_for_status()
            total_size = int(response.headers.get('content-length', 0))
            
            with open(zip_path, 'wb') as f:
                if total_size == 0:
                    # No content-length header, download without progress
                    for chunk in response.iter_bytes(chunk_size=8192):
                        f.write(chunk)
                else:
                    if show_progress:
                        # Show progress bar
                        with Progress(
                            SpinnerColumn(),
                            TextColumn("[progress.description]{task.description}"),
                            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                            console=console,
                        ) as progress:
                            task = progress.add_task("Downloading...", total=total_size)
                            downloaded = 0
                            for chunk in response.iter_bytes(chunk_size=8192):
                                f.write(chunk)
                                downloaded += len(chunk)
                                progress.update(task, completed=downloaded)
                    else:
                        # Silent download loop
                        for chunk in response.iter_bytes(chunk_size=8192):
                            f.write(chunk)
    
    except httpx.RequestError as e:
        if verbose:
            console.print(f"[red]Error downloading template:[/red] {e}")
        if zip_path.exists():
            zip_path.unlink()
        raise typer.Exit(1)
    if verbose:
        console.print(f"Downloaded: {filename}")
    metadata = {
        "filename": filename,
        "size": file_size,
        "release": release_data["tag_name"],
        "asset_url": download_url
    }
    return zip_path, metadata


def download_and_extract_template(project_path: Path, ai_assistant: str, is_current_dir: bool = False, *, verbose: bool = True, tracker: StepTracker | None = None) -> Path:
    """Download the latest release and extract it to create a new project.
    Returns project_path. Uses tracker if provided (with keys: fetch, download, extract, cleanup)
    """
    current_dir = Path.cwd()
    
    # Step: fetch + download combined
    if tracker:
        tracker.start("fetch", "contacting GitHub API")
    try:
        zip_path, meta = download_template_from_github(
            ai_assistant,
            current_dir,
            verbose=verbose and tracker is None,
            show_progress=(tracker is None)
        )
        if tracker:
            tracker.complete("fetch", f"release {meta['release']} ({meta['size']:,} bytes)")
            tracker.add("download", "Download template")
            tracker.complete("download", meta['filename'])  # already downloaded inside helper
    except Exception as e:
        if tracker:
            tracker.error("fetch", str(e))
        else:
            if verbose:
                console.print(f"[red]Error downloading template:[/red] {e}")
        raise
    
    if tracker:
        tracker.add("extract", "Extract template")
        tracker.start("extract")
    elif verbose:
        console.print("Extracting template...")
    
    try:
        # Create project directory only if not using current directory
        if not is_current_dir:
            project_path.mkdir(parents=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # List all files in the ZIP for debugging
            zip_contents = zip_ref.namelist()
            if tracker:
                tracker.start("zip-list")
                tracker.complete("zip-list", f"{len(zip_contents)} entries")
            elif verbose:
                console.print(f"[cyan]ZIP contains {len(zip_contents)} items[/cyan]")
            
            # For current directory, extract to a temp location first
            if is_current_dir:
                with tempfile.TemporaryDirectory() as temp_dir:
                    temp_path = Path(temp_dir)
                    zip_ref.extractall(temp_path)
                    
                    # Check what was extracted
                    extracted_items = list(temp_path.iterdir())
                    if tracker:
                        tracker.start("extracted-summary")
                        tracker.complete("extracted-summary", f"temp {len(extracted_items)} items")
                    elif verbose:
                        console.print(f"[cyan]Extracted {len(extracted_items)} items to temp location[/cyan]")
                    
                    # Handle GitHub-style ZIP with a single root directory
                    source_dir = temp_path
                    if len(extracted_items) == 1 and extracted_items[0].is_dir():
                        source_dir = extracted_items[0]
                        if tracker:
                            tracker.add("flatten", "Flatten nested directory")
                            tracker.complete("flatten")
                        elif verbose:
                            console.print(f"[cyan]Found nested directory structure[/cyan]")
                    
                    # Copy contents to current directory
                    for item in source_dir.iterdir():
                        dest_path = project_path / item.name
                        if item.is_dir():
                            if dest_path.exists():
                                if verbose and not tracker:
                                    console.print(f"[yellow]Merging directory:[/yellow] {item.name}")
                                # Recursively copy directory contents
                                for sub_item in item.rglob('*'):
                                    if sub_item.is_file():
                                        rel_path = sub_item.relative_to(item)
                                        dest_file = dest_path / rel_path
                                        dest_file.parent.mkdir(parents=True, exist_ok=True)
                                        shutil.copy2(sub_item, dest_file)
                            else:
                                shutil.copytree(item, dest_path)
                        else:
                            if dest_path.exists() and verbose and not tracker:
                                console.print(f"[yellow]Overwriting file:[/yellow] {item.name}")
                            shutil.copy2(item, dest_path)
                    if verbose and not tracker:
                        console.print(f"[cyan]Template files merged into current directory[/cyan]")
            else:
                # Extract directly to project directory (original behavior)
                zip_ref.extractall(project_path)
                
                # Check what was extracted
                extracted_items = list(project_path.iterdir())
                if tracker:
                    tracker.start("extracted-summary")
                    tracker.complete("extracted-summary", f"{len(extracted_items)} top-level items")
                elif verbose:
                    console.print(f"[cyan]Extracted {len(extracted_items)} items to {project_path}:[/cyan]")
                    for item in extracted_items:
                        console.print(f"  - {item.name} ({'dir' if item.is_dir() else 'file'})")
                
                # Handle GitHub-style ZIP with a single root directory
                if len(extracted_items) == 1 and extracted_items[0].is_dir():
                    # Move contents up one level
                    nested_dir = extracted_items[0]
                    temp_move_dir = project_path.parent / f"{project_path.name}_temp"
                    # Move the nested directory contents to temp location
                    shutil.move(str(nested_dir), str(temp_move_dir))
                    # Remove the now-empty project directory
                    project_path.rmdir()
                    # Rename temp directory to project directory
                    shutil.move(str(temp_move_dir), str(project_path))
                    if tracker:
                        tracker.add("flatten", "Flatten nested directory")
                        tracker.complete("flatten")
                    elif verbose:
                        console.print(f"[cyan]Flattened nested directory structure[/cyan]")
                    
    except Exception as e:
        if tracker:
            tracker.error("extract", str(e))
        else:
            if verbose:
                console.print(f"[red]Error extracting template:[/red] {e}")
        # Clean up project directory if created and not current directory
        if not is_current_dir and project_path.exists():
            shutil.rmtree(project_path)
        raise typer.Exit(1)
    else:
        if tracker:
            tracker.complete("extract")
    finally:
        if tracker:
            tracker.add("cleanup", "Remove temporary archive")
        # Clean up downloaded ZIP file
        if zip_path.exists():
            zip_path.unlink()
            if tracker:
                tracker.complete("cleanup")
            elif verbose:
                console.print(f"Cleaned up: {zip_path.name}")
    
    return project_path


@app.command()
def generate_spec(
    project_path: str = typer.Argument(None, help="Path to project to analyze (defaults to scanning extracted directory)"),
    output_dir: str = typer.Option("./specs", "--output", "-o", help="Output directory for generated specs"),
    all_projects: bool = typer.Option(False, "--all", help="Generate specs for all projects in extracted directory"),
    extracted_dir: str = typer.Option("./extracted", "--extracted-dir", help="Path to extracted directory"),
):
    """
    Generate comprehensive specifications for projects in the extracted directory.
    
    This command analyzes project structure, documentation, and code to generate
    detailed specifications following the spec-driven development template.
    
    Examples:
        specify generate-spec extracted/ai-opencog
        specify generate-spec --all
        specify generate-spec --all --output ./generated-specs
    """
    show_banner()
    
    console.print(Panel.fit(
        "[bold cyan]Generate Comprehensive Project Specifications[/bold cyan]\n"
        "Analyzing projects to create detailed spec-driven development specifications",
        border_style="cyan"
    ))
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    projects_to_analyze = []
    
    if all_projects:
        # Scan extracted directory for projects
        extracted_path = Path(extracted_dir)
        if not extracted_path.exists():
            console.print(f"[red]Error:[/red] Extracted directory '{extracted_dir}' does not exist")
            raise typer.Exit(1)
        
        for item in extracted_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                projects_to_analyze.append(item)
        
        if not projects_to_analyze:
            console.print(f"[yellow]No projects found in '{extracted_dir}'[/yellow]")
            return
        
        console.print(f"[cyan]Found {len(projects_to_analyze)} projects to analyze[/cyan]")
    
    elif project_path:
        # Analyze specific project
        proj_path = Path(project_path)
        if not proj_path.exists():
            console.print(f"[red]Error:[/red] Project path '{project_path}' does not exist")
            raise typer.Exit(1)
        projects_to_analyze.append(proj_path)
    
    else:
        # Default: scan extracted directory
        extracted_path = Path(extracted_dir)
        if extracted_path.exists():
            for item in extracted_path.iterdir():
                if item.is_dir() and not item.name.startswith('.'):
                    projects_to_analyze.append(item)
        
        if not projects_to_analyze:
            console.print(f"[yellow]No projects found in '{extracted_dir}'. Use --help for usage information.[/yellow]")
            return
    
    # Analyze each project and generate specs
    tracker = StepTracker("Generate Project Specifications")
    
    with Live(tracker.render(), console=console, refresh_per_second=4, transient=True) as live:
        tracker.attach_refresh(lambda: live.update(tracker.render()))
        
        for i, project in enumerate(projects_to_analyze, 1):
            project_key = f"project-{i}"
            tracker.add(project_key, f"Analyze {project.name}")
            tracker.start(project_key, "scanning files")
            
            try:
                # Analyze the project
                analyzer = ProjectAnalyzer(project)
                analysis_data = analyzer.analyze()
                
                tracker.start(project_key, "generating spec")
                
                # Generate the specification
                spec_generator = SpecGenerator()
                spec_content = spec_generator.generate_spec(analysis_data)
                
                # Write the spec to output directory
                spec_filename = f"{project.name}-spec.md"
                spec_path = output_path / spec_filename
                
                with open(spec_path, 'w', encoding='utf-8') as f:
                    f.write(spec_content)
                
                tracker.complete(project_key, f"→ {spec_filename}")
                
            except Exception as e:
                tracker.error(project_key, str(e))
                console.print(f"[red]Error analyzing {project.name}: {e}[/red]")
    
    # Final static tree
    console.print(tracker.render())
    console.print(f"\n[bold green]Specification generation complete![/bold green]")
    console.print(f"[cyan]Generated specs saved to:[/cyan] {output_path}")
    
    # Show summary
    generated_files = list(output_path.glob("*-spec.md"))
    if generated_files:
        console.print(f"\n[bold]Generated specifications:[/bold]")
        for spec_file in generated_files:
            console.print(f"  • {spec_file.name}")


@app.command()
def init(
    project_name: str = typer.Argument(None, help="Name for your new project directory (optional if using --here)"),
    ai_assistant: str = typer.Option(None, "--ai", help="AI assistant to use: claude, gemini, or copilot"),
    ignore_agent_tools: bool = typer.Option(False, "--ignore-agent-tools", help="Skip checks for AI agent tools like Claude Code"),
    no_git: bool = typer.Option(False, "--no-git", help="Skip git repository initialization"),
    here: bool = typer.Option(False, "--here", help="Initialize project in the current directory instead of creating a new one"),
):
    """
    Initialize a new Specify project from the latest template.
    
    This command will:
    1. Check that required tools are installed (git is optional)
    2. Let you choose your AI assistant (Claude Code, Gemini CLI, or GitHub Copilot)
    3. Download the appropriate template from GitHub
    4. Extract the template to a new project directory or current directory
    5. Initialize a fresh git repository (if not --no-git and no existing repo)
    6. Optionally set up AI assistant commands
    
    Examples:
        specify init my-project
        specify init my-project --ai claude
        specify init my-project --ai gemini
        specify init my-project --ai copilot --no-git
        specify init --ignore-agent-tools my-project
        specify init --here --ai claude
        specify init --here
    """
    # Show banner first
    show_banner()
    
    # Validate arguments
    if here and project_name:
        console.print("[red]Error:[/red] Cannot specify both project name and --here flag")
        raise typer.Exit(1)
    
    if not here and not project_name:
        console.print("[red]Error:[/red] Must specify either a project name or use --here flag")
        raise typer.Exit(1)
    
    # Determine project directory
    if here:
        project_name = Path.cwd().name
        project_path = Path.cwd()
        
        # Check if current directory has any files
        existing_items = list(project_path.iterdir())
        if existing_items:
            console.print(f"[yellow]Warning:[/yellow] Current directory is not empty ({len(existing_items)} items)")
            console.print("[yellow]Template files will be merged with existing content and may overwrite existing files[/yellow]")
            
            # Ask for confirmation
            response = typer.confirm("Do you want to continue?")
            if not response:
                console.print("[yellow]Operation cancelled[/yellow]")
                raise typer.Exit(0)
    else:
        project_path = Path(project_name).resolve()
        # Check if project directory already exists
        if project_path.exists():
            console.print(f"[red]Error:[/red] Directory '{project_name}' already exists")
            raise typer.Exit(1)
    
    console.print(Panel.fit(
        "[bold cyan]Specify Project Setup[/bold cyan]\n"
        f"{'Initializing in current directory:' if here else 'Creating new project:'} [green]{project_path.name}[/green]"
        + (f"\n[dim]Path: {project_path}[/dim]" if here else ""),
        border_style="cyan"
    ))
    
    # Check git only if we might need it (not --no-git)
    git_available = True
    if not no_git:
        git_available = check_tool("git", "https://git-scm.com/downloads")
        if not git_available:
            console.print("[yellow]Git not found - will skip repository initialization[/yellow]")

    # AI assistant selection
    if ai_assistant:
        if ai_assistant not in AI_CHOICES:
            console.print(f"[red]Error:[/red] Invalid AI assistant '{ai_assistant}'. Choose from: {', '.join(AI_CHOICES.keys())}")
            raise typer.Exit(1)
        selected_ai = ai_assistant
    else:
        # Use arrow-key selection interface
        selected_ai = select_with_arrows(
            AI_CHOICES, 
            "Choose your AI assistant:", 
            "copilot"
        )
    
    # Check agent tools unless ignored
    if not ignore_agent_tools:
        agent_tool_missing = False
        if selected_ai == "claude":
            if not check_tool("claude", "Install from: https://docs.anthropic.com/en/docs/claude-code/setup"):
                console.print("[red]Error:[/red] Claude CLI is required for Claude Code projects")
                agent_tool_missing = True
        elif selected_ai == "gemini":
            if not check_tool("gemini", "Install from: https://github.com/google-gemini/gemini-cli"):
                console.print("[red]Error:[/red] Gemini CLI is required for Gemini projects")
                agent_tool_missing = True
        # GitHub Copilot check is not needed as it's typically available in supported IDEs
        
        if agent_tool_missing:
            console.print("\n[red]Required AI tool is missing![/red]")
            console.print("[yellow]Tip:[/yellow] Use --ignore-agent-tools to skip this check")
            raise typer.Exit(1)
    
    # Download and set up project
    # New tree-based progress (no emojis); include earlier substeps
    tracker = StepTracker("Initialize Specify Project")
    # Flag to allow suppressing legacy headings
    sys._specify_tracker_active = True
    # Pre steps recorded as completed before live rendering
    tracker.add("precheck", "Check required tools")
    tracker.complete("precheck", "ok")
    tracker.add("ai-select", "Select AI assistant")
    tracker.complete("ai-select", f"{selected_ai}")
    for key, label in [
        ("fetch", "Fetch latest release"),
        ("download", "Download template"),
        ("extract", "Extract template"),
        ("zip-list", "Archive contents"),
        ("extracted-summary", "Extraction summary"),
        ("cleanup", "Cleanup"),
        ("git", "Initialize git repository"),
        ("final", "Finalize")
    ]:
        tracker.add(key, label)

    # Use transient so live tree is replaced by the final static render (avoids duplicate output)
    with Live(tracker.render(), console=console, refresh_per_second=8, transient=True) as live:
        tracker.attach_refresh(lambda: live.update(tracker.render()))
        try:
            download_and_extract_template(project_path, selected_ai, here, verbose=False, tracker=tracker)

            # Git step
            if not no_git:
                tracker.start("git")
                if is_git_repo(project_path):
                    tracker.complete("git", "existing repo detected")
                elif git_available:
                    if init_git_repo(project_path, quiet=True):
                        tracker.complete("git", "initialized")
                    else:
                        tracker.error("git", "init failed")
                else:
                    tracker.skip("git", "git not available")
            else:
                tracker.skip("git", "--no-git flag")

            tracker.complete("final", "project ready")
        except Exception as e:
            tracker.error("final", str(e))
            if not here and project_path.exists():
                shutil.rmtree(project_path)
            raise typer.Exit(1)
        finally:
            # Force final render
            pass

    # Final static tree (ensures finished state visible after Live context ends)
    console.print(tracker.render())
    console.print("\n[bold green]Project ready.[/bold green]")
    
    # Boxed "Next steps" section
    steps_lines = []
    if not here:
        steps_lines.append(f"1. [bold green]cd {project_name}[/bold green]")
        step_num = 2
    else:
        steps_lines.append("1. You're already in the project directory!")
        step_num = 2

    if selected_ai == "claude":
        steps_lines.append(f"{step_num}. Open in Visual Studio Code and start using / commands with Claude Code")
        steps_lines.append("   - Type / in any file to see available commands")
        steps_lines.append("   - Use /specify to create specifications")
        steps_lines.append("   - Use /plan to create implementation plans")
        steps_lines.append("   - Use /tasks to generate tasks")
    elif selected_ai == "gemini":
        steps_lines.append(f"{step_num}. Use / commands with Gemini CLI")
        steps_lines.append("   - Run gemini /specify to create specifications")
        steps_lines.append("   - Run gemini /plan to create implementation plans")
        steps_lines.append("   - See GEMINI.md for all available commands")
    elif selected_ai == "copilot":
        steps_lines.append(f"{step_num}. Open in Visual Studio Code and use [bold cyan]/specify[/], [bold cyan]/plan[/], [bold cyan]/tasks[/] commands with GitHub Copilot")

    step_num += 1
    steps_lines.append(f"{step_num}. Update [bold magenta]CONSTITUTION.md[/bold magenta] with your project's non-negotiable principles")

    steps_panel = Panel("\n".join(steps_lines), title="Next steps", border_style="cyan", padding=(1,2))
    console.print()  # blank line
    console.print(steps_panel)
    
    # Removed farewell line per user request


@app.command()
def check():
    """Check that all required tools are installed."""
    show_banner()
    console.print("[bold]Checking Specify requirements...[/bold]\n")
    
    # Check if we have internet connectivity by trying to reach GitHub API
    console.print("[cyan]Checking internet connectivity...[/cyan]")
    try:
        response = httpx.get("https://api.github.com", timeout=5, follow_redirects=True)
        console.print("[green]✓[/green] Internet connection available")
    except httpx.RequestError:
        console.print("[red]✗[/red] No internet connection - required for downloading templates")
        console.print("[yellow]Please check your internet connection[/yellow]")
    
    console.print("\n[cyan]Optional tools:[/cyan]")
    git_ok = check_tool("git", "https://git-scm.com/downloads")
    
    console.print("\n[cyan]Optional AI tools:[/cyan]")
    claude_ok = check_tool("claude", "Install from: https://docs.anthropic.com/en/docs/claude-code/setup")
    gemini_ok = check_tool("gemini", "Install from: https://github.com/google-gemini/gemini-cli")
    
    console.print("\n[green]✓ Specify CLI is ready to use![/green]")
    if not git_ok:
        console.print("[yellow]Consider installing git for repository management[/yellow]")
    if not (claude_ok or gemini_ok):
        console.print("[yellow]Consider installing an AI assistant for the best experience[/yellow]")


def main():
    app()


if __name__ == "__main__":
    main()
