#!/usr/bin/env node

/**
 * Preparation script for npm publishing
 * Validates package structure and runs pre-publish checks
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✓ ${description} exists`);
        return true;
    } else {
        console.log(`✗ ${description} missing: ${filePath}`);
        return false;
    }
}

function validatePackageJson() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
        console.log('✗ package.json not found');
        return false;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    const requiredFields = ['name', 'version', 'description', 'main', 'author', 'license'];
    let valid = true;

    requiredFields.forEach(field => {
        if (!pkg[field]) {
            console.log(`✗ package.json missing required field: ${field}`);
            valid = false;
        } else {
            console.log(`✓ package.json has ${field}: ${pkg[field]}`);
        }
    });

    // Check if name is scoped
    if (pkg.name && pkg.name.startsWith('@')) {
        if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
            console.log('✗ Scoped package requires publishConfig.access: "public"');
            valid = false;
        } else {
            console.log('✓ Scoped package has public access configured');
        }
    }

    return valid;
}

function checkMainFile() {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const mainFile = pkg.main;
    
    if (fs.existsSync(mainFile)) {
        console.log(`✓ Main file exists: ${mainFile}`);
        return true;
    } else {
        console.log(`✗ Main file missing: ${mainFile}`);
        return false;
    }
}

function validateReadme() {
    const readmePath = 'README.md';
    if (!fs.existsSync(readmePath)) {
        console.log('✗ README.md not found');
        return false;
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    const requiredSections = ['Installation', 'Usage', 'Features'];
    let valid = true;

    requiredSections.forEach(section => {
        if (content.toLowerCase().includes(section.toLowerCase())) {
            console.log(`✓ README contains ${section} section`);
        } else {
            console.log(`⚠ README missing ${section} section`);
        }
    });

    return valid;
}

function main() {
    console.log('🔍 Validating package for npm publishing...\n');

    let allValid = true;

    // Core files
    allValid = checkFile('package.json', 'Package configuration') && allValid;
    allValid = checkFile('README.md', 'README documentation') && allValid;
    allValid = checkFile('LICENSE', 'License file') && allValid;
    allValid = checkFile('src/index.js', 'Main entry point') && allValid;
    allValid = checkFile('types/index.d.ts', 'TypeScript definitions') && allValid;

    console.log('');

    // Validate package.json
    allValid = validatePackageJson() && allValid;
    console.log('');

    // Validate main file
    allValid = checkMainFile() && allValid;
    console.log('');

    // Validate README
    validateReadme();
    console.log('');

    // Check dependencies
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        console.log(`📦 Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
        console.log(`🛠 Dev Dependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
        console.log('');
    } catch (error) {
        console.log('⚠ Could not read dependencies');
    }

    // Summary
    if (allValid) {
        console.log('🎉 Package validation passed! Ready for publishing.');
        console.log('\nNext steps:');
        console.log('1. Update author and repository info in package.json');
        console.log('2. Run: npm login');
        console.log('3. Run: npm publish');
        process.exit(0);
    } else {
        console.log('❌ Package validation failed. Please fix the issues above.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkFile, validatePackageJson, checkMainFile, validateReadme };
