/**
 * direct JavaScript Toolbox
 * All-in-one toolbox to provide more reusable JavaScript features
 *
 * (C) direct Netware Group - All rights reserved
 * https://www.direct-netware.de/redirect?djt;html;fixable_block
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/.
 *
 * https://www.direct-netware.de/redirect?licenses;mpl2
 *
 * @license Mozilla Public License, v. 2.0
 */

import CommonJs from 'rollup-plugin-commonjs';
import Resolve from 'rollup-plugin-node-resolve';
import { terser as Terser } from 'rollup-plugin-terser';
import TypeScript from 'rollup-plugin-typescript2';

function outputBrowserModulePathGenerator(format, paths) {
    if (!paths) {
        paths = { };
    }

    return function(moduleId) {
        if (moduleId in paths) {
            moduleId = paths[moduleId];
        } else if (format == 'esm' && /^\w/.test(moduleId)) {
            moduleId = `./${moduleId}.js`;
        }

        return moduleId;
    };
}

export function applyDefaultConfig(customConfig) {
    const resolveConfig = (
        customConfig.inputResolveConfig ?
        customConfig.inputResolveConfig :
        {
            browser: true,
            main: true,
            jsnext: true,
            module: true,
            extensions: [ '.js', '.json', '.ts' ],
            moduleOnly: true,
            preferBuiltins: true
        }
    );

    if (!customConfig.inputTsConfig) {
        throw new Error('Rollup input TypeScript config missing');
    }

    if (!Array.isArray(customConfig.output)) {
        throw new Error('Rollup output config missing');
    }

    for (const outputConfig of customConfig.output) {
        outputConfig.paths = outputBrowserModulePathGenerator(outputConfig.format, outputConfig.paths);
    }

    return {
        input: 'src/module.ts',
        output: customConfig.output,

        external: [
            'djt-html-riot-tag',
            'riot'
        ],

        plugins: [
            Resolve(resolveConfig),

            TypeScript({ tsconfig: customConfig.inputTsConfig }),

            CommonJs({
                namedExports: {
                    'tslib': [ '__assign', '__extends' ]
                }
            }),

            Terser()
        ]
    };
};
