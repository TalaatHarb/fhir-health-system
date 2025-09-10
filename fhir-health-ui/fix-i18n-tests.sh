#!/bin/bash

# Script to fix i18n-related test failures

echo "Fixing i18n test imports..."

# Find all test files that import render from @testing-library/react
find src/__tests__ -name "*.test.tsx" -o -name "*.test.ts" | while read file; do
    if grep -q "import.*render.*from '@testing-library/react'" "$file"; then
        echo "Fixing imports in $file"
        # Replace the import to use test-utils instead
        sed -i "s|import { \([^}]*\) } from '@testing-library/react'|import { \1 } from '../../test-utils'|g" "$file"
        sed -i "s|import { \([^}]*\) } from '@testing-library/react'|import { \1 } from '../test-utils'|g" "$file"
    fi
done

echo "Done fixing imports!"