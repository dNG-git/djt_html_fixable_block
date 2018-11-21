/**
 * direct JavaScript Toolbox
 * All-in-one toolbox to provide more reusable JavaScript features
 *
 * (C) direct Netware Group - All rights reserved
 * https://www.direct-netware.de/redirect?djt;xhtml5;fixable_block
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/.
 *
 * https://www.direct-netware.de/redirect?licenses;mpl2
 *
 * @license Mozilla Public License, v. 2.0
 */

import { RiotTag } from 'djt-xhtml5-riot-tag';
import { Tag, TagOpts } from 'riot';

import { Fixator } from './fixator';

/**
 * The "djt-fixable-block" supports (top) fixed elements on scrollable pages.
 *
 * @author    direct Netware Group
 * @copyright (C) direct Netware Group - All rights reserved
 * @package   djt-xhtml5-fixable-block
 * @since     v1.0.0
 * @license   https://www.direct-netware.de/redirect?licenses;mpl2
 *            Mozilla Public License, v. 2.0
 */
export class FixableBlock extends RiotTag {
    /**
     * Fixator instance used for this block tag
     */
    protected fixatorInstance: Fixator;

    /**
     * Constructor (FixableBlock)
     *
     * @param riotTagInstance Riot.js tag instance if mounted internally
     * @param opts Riot.js tag options
     *
     * @since v1.0.0
     */
    constructor(riotTagInstance: Tag, opts?: TagOpts) {
        super(riotTagInstance, opts);

        this.isElementSizeRelevant = true;
        this.isWindowResizeRelevant = true;
    }

    /**
     * Called for tag event "before-unmount".
     *
     * @since v1.0.0
     */
    public onBeforeUnmount() {
        super.onBeforeUnmount();

        if (this.fixatorInstance) {
            this.fixatorInstance.destroy();
            this.fixatorInstance = undefined;
        }
    }

    /**
     * Called on custom DOM event "xdomchanged".
     *
     * @param event Event object
     *
     * @since v1.0.0
     */
    public onDomChanged(event: Event) {
        super.onDomChanged(event);

        if (this.fixatorInstance) {
            this.fixatorInstance.onResize();
        }
    }

    /**
     * Called for tag event "mount".
     *
     * @since v1.0.0
     */
    public onMounted() {
        super.onMounted();

        if (!this.fixatorInstance) {
            // tslint:disable-next-line:no-any
            const options: any = {
                fixedClass: this.riotTagInstance.opts.fixedClass,
                isExternalTriggered: true
            };

            if ('maximizeIfFixed' in this.riotTagInstance.opts) {
                options['maximizeIfFixed'] = FixableBlock.getValueAsNumber(this.riotTagInstance.opts.maximizeIfFixed);
            }

            this.fixatorInstance = new Fixator(this.riotTagInstance.root, options);
        }

        this.on('resize', this.fixatorInstance.onResize);
    }

    /**
     * Called on DOM event "resize".
     *
     * @param event Event object
     *
     * @since v1.0.0
     */
    public onWindowResized(event: Event) {
        super.onWindowResized(event);

        if (this.fixatorInstance) {
            this.fixatorInstance.onResize();
        }
    }

    /**
     * riotjs.com: The style for the tag
     *
     * @return CSS style rules
     * @since  v1.0.0
     */
    protected static get css() {
        return `
djt-fixable-block { display: block }
        `;
    }

    /**
     * riotjs.com: The tag name
     *
     * @return Riot.js custom tag name
     * @since  v1.0.0
     */
    public static get tagName() {
        return 'djt-fixable-block';
    }

    /**
     * riotjs.com: The layout with expressions
     *
     * @return Layout template
     * @since  v1.0.0
     */
    protected static get tmpl() {
        return `<yield>`;
    }
}
