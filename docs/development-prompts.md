# Development Workflow with Amazon Q Prompts

This project uses specialized Amazon Q prompts to maintain consistent code quality and development practices.

## Prompt System Overview

During the Phase 1 refactoring, we used a multi-expert prompt system to systematically improve code quality:

### Specialized Prompts Used

1. **@refactor-expert** - Component refactoring specialist
   - Focuses on breaking down god components
   - Ensures single responsibility principle
   - Maintains existing functionality while improving structure

2. **@web3-expert** - Blockchain development specialist  
   - Web3-specific patterns and best practices
   - Smart contract interaction optimization
   - Multi-chain architecture guidance

3. **@debug-expert** - Systematic troubleshooting specialist
   - Race condition identification
   - Performance issue diagnosis
   - React state management debugging

4. **@code-reviewer** - Code quality analyst
   - Identifies technical debt
   - Performance bottleneck detection
   - Security vulnerability assessment

## How to Set Up Similar Prompts

### 1. Create Prompt Directory
```bash
mkdir -p ~/.aws/amazonq/prompts
```

### 2. Create Specialized Prompts
Each prompt should be a markdown file with:
- Clear expertise area definition
- Specific instructions for that domain
- Project context and constraints
- Expected output format

### 3. Usage Examples
```
# Single expert consultation
@refactor-expert @ComponentName.tsx
Help me break down this god component

# Multi-expert collaboration  
@debug-expert @web3-expert @ComponentName.tsx
I need both debugging and Web3 expertise for this issue
```

## Benefits Achieved

### Phase 1 Results
- **Systematic debugging** - Identified render loops and race conditions
- **Proper Web3 patterns** - Fixed approval flow architecture
- **Clean refactoring** - Extracted components without breaking functionality
- **Performance improvements** - Eliminated expensive operations

### Development Quality
- **Consistent expertise** - Same high-quality guidance every time
- **Comprehensive analysis** - Multiple perspectives on complex issues
- **Faster problem-solving** - Specialized knowledge for specific domains
- **Better learning** - Understanding the 'why' behind solutions

## Project Rules Integration

The project also uses auto-applied rules in `.amazonq/rules/project-standards.md` that provide:
- Automatic project context in every conversation
- Consistent coding standards
- Architecture guidelines
- Known technical debt awareness

## Recommendation for New Developers

1. **Start with project rules** - These are automatically applied
2. **Create personal prompts** - Customize based on your workflow preferences  
3. **Use multi-expert approach** - Combine prompts for complex issues
4. **Document learnings** - Update project rules as patterns emerge

This prompt-driven development approach was key to successfully refactoring complex components while maintaining functionality and improving code quality.