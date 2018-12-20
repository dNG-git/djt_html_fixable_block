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

import { DomUtilities } from 'djt-html-riot-tag';

/**
 * The "Fixator" class supports (top) fixed block elements on scrollable
 * pages. At most one (the latest one appearing on the page while scrolling)
 * is fixed.
 *
 * @author    direct Netware Group
 * @copyright (C) direct Netware Group - All rights reserved
 * @package   djt-html-fixable-block
 * @since     v1.0.0
 * @license   https://www.direct-netware.de/redirect?licenses;mpl2
 *            Mozilla Public License, v. 2.0
 */
export class Fixator {
    /**
     * Update CSS because of a size change
     */
    protected static readonly UPDATE_CSS_TRIGGER_SIZE_CHANGED = 1 << 0;
    /**
     * Update CSS because the fixed state changed
     */
    protected static readonly UPDATE_CSS_TRIGGER_FIXED_STATE_CHANGED = 1 << 1;
    /**
     * Update CSS because the hidden state of the fixed node changed
     */
    protected static readonly UPDATE_CSS_TRIGGER_FIXED_HIDDEN_STATE_CHANGED = 1 << 2;

    /**
     * List of activated (but maybe hidden) fixed elements
     */
    protected static fixedElements: Fixator[] = [ ];

    // tslint:disable:no-any
    /**
     * Dummy node instance used for positioning if fixed
     */
    protected $dummyNode: any;
    /**
     * Node instance to fix on scroll
     */
    protected $node: any;
    /**
     * Original node attributes
     */
    protected nodeAttributes: any;
    /**
     * Fixator event ID for this instance
     */
    protected eventId: string;
    /**
     * Fixator CSS class to be applied
     */
    protected fixedClass = 'djt-fixable-block-fixed';
    /**
     * True if node is fixed
     */
    protected isFixed = false;
    /**
     * True if node is fixed but not shown
     */
    protected isFixedButHidden = false;
    /**
     * True to maximize width in fixed state
     */
    protected isMaximizedIfFixed = false;
    /**
     * Original node metrics calculated
     */
    protected metrics: any;
    // tslint:enable:no-any

    /**
     * Constructor (Fixator)
     *
     * @param element (X)HTML5 element
     * @param opts Fixable block options
     *
     * @since v1.0.0
     */
    // tslint:disable-next-line:no-any
    constructor(element: Element, opts?: any) {
        if (!DomUtilities.isDomManipulationAvailable) {
            throw new Error('DOM manipulation support is required');
        }

        if (!opts) {
            opts = { };
        }

        if (typeof opts.fixedClass == 'string') {
            this.fixedClass = opts.fixedClass;
        }

        this.isMaximizedIfFixed = Boolean(opts.maximizeIfFixed);

        this.eventId = 'djt-fixable-block-event-listener-' + Math.random().toString().replace('.', '');
        this.$node = $(element);
        this.$dummyNode = $('<div style="display: none; visibility: hidden"></div>').insertAfter(this.$node);

        this.nodeAttributes = this.$node.css([ 'position', 'top', 'bottom', 'left', 'right' ]);
        this.nodeAttributes['width'] = 'auto';

        if (!('position' in this.nodeAttributes)) {
            this.nodeAttributes['position'] = 'initial';
        }

        if (!('top' in this.nodeAttributes)) {
            this.nodeAttributes['top'] = 'initial';
        }

        if (!('bottom' in this.nodeAttributes)) {
            this.nodeAttributes['bottom'] = 'initial';
        }

        if (!('left' in this.nodeAttributes)) {
            this.nodeAttributes['left'] = 'initial';
        }

        if (!('right' in this.nodeAttributes)) {
            this.nodeAttributes['right'] = 'initial';
        }

        // tslint:disable-next-line:no-any
        const $self: any = $(self);

        this.onResize = this.onResize.bind(this);
        this.onScroll = this.onScroll.bind(this);

        if (!opts.isExternalTriggered) {
            $self.on(`resize.${this.eventId}`, this.onResize);
            $self.on(`xdomchanged.${this.eventId}`, this.onResize);

            // tslint:disable-next-line:no-any
            (this.$node as any).on(`xresize.${this.eventId}`, this.onResize);
        }

        $self.on(`scroll.${this.eventId}`, this.onScroll);
    }

    /**
     * Returns the DOM element being fixable.
     *
     * @return DOM element being fixable
     * @since  v1.0.0
     */
    public get element() {
        return this.$node.get(0);
    }

    /**
     * Returns the CSS class value in use for fixed nodes.
     *
     * @return CSS class value
     * @since  v1.0.0
     */
    public get fixedCssClass() {
        return this.fixedClass;
    }

    /**
     * Returns the corresponding class of the calling instance.
     *
     * @return Class object
     * @since  v1.0.0
     */
    protected get instanceClass() {
        return Object.getPrototypeOf(this).constructor;
    }

    /**
     * Destroys the fixable block instance and its attached event listeners.
     *
     * @since v1.0.0
     */
    public destroy() {
        $(self).off(`.${this.eventId}`);
        this.$node.off(`xresize.${this.eventId}`);

        if (this.isFixed) {
            this.isFixed = false;
            const instanceClass = this.instanceClass;

            this.updateNodeCss(instanceClass.UPDATE_CSS_TRIGGER_FIXED_STATE_CHANGED);

            instanceClass.fixedElements = instanceClass.fixedElements.filter(
                (instance: Fixator) => instance !== this
            );

            if (instanceClass.fixedElements.length > 0) {
                $(this.element).trigger('xdomchanged');
            }
        }

        this.$dummyNode.remove();
    }

    /**
     * Returns the metrics of the fixable node.
     *
     * @return Node metrics
     * @since  v1.0.0
     */
    protected getNodeMetrics() {
        const $node = (this.isFixed ? this.$dummyNode : this.$node);

        let isOffsetCalculated = false;
        let metrics;
        let originalMetrics;

        if (this.isFixed) {
            this.$dummyNode.css('width', 'auto');
        }

        if ($node.get(0).getBoundingClientRect) {
            const rect = $node.get(0).getBoundingClientRect();

            metrics = {
                width: rect.width,
                height: rect.height,
                top: (rect.top ? rect.top : 0) + self.pageYOffset,
                left: (rect.left ? rect.left : 0) + self.pageXOffset
            };
        }

        if (metrics.width === undefined) {
            isOffsetCalculated = true;
            metrics = $node.offset();
        }

        if (!this.isFixed) {
            originalMetrics = metrics;
        } else if (isOffsetCalculated) {
            originalMetrics = this.$node.offset();
        } else {
            originalMetrics = this.element.getBoundingClientRect();
        }

        const _return = {
            width: ($node.outerWidth ? $node.outerWidth(true) : metrics.width),
            height: (this.$node.outerHeight ? this.$node.outerHeight(true) : originalMetrics.height),
            top: metrics.top,
            left: metrics.left,
            contentWidth: (metrics.width ? metrics.width : $node.width()),
            contentHeight: (originalMetrics.height ? originalMetrics.height : this.$node.height())
        };

        if (this.isFixed) {
            this.$dummyNode.css('width', this.metrics.width + 'px');
        }

        return _return;
    }

    /**
     * Initializes the cached node metrics and the dummy node size.
     *
     * @since v1.0.0
     */
    protected initMetricsAndDummyNode() {
        this.metrics = this.getNodeMetrics();

        this.$dummyNode.css({ width: this.metrics.width + 'px', height: this.metrics.height + 'px' });
    }

    /**
     * Called for tag event "resize" and DOM events "xdomchanged" and "xresize".
     *
     * @param _ Event object
     *
     * @since v1.0.0
     */
    public onResize(_?: Event) {
        if (this.$node.css('display').toLowerCase() != 'none') {
            this.recalculateAndUpdate();
        }
    }

    /**
     * Called on DOM event "scroll".
     *
     * @param _ Event object
     *
     * @since v1.0.0
     */
    public onScroll(_: Event) {
        if (this.$node.css('display').toLowerCase() != 'none') {
            this.updateFixedState();
        }
    }

    /**
     * The "recalculateAndUpdate()" method is called after changes that may impact
     * the fixed state of the block.
     *
     * @since v1.0.0
     */
    protected recalculateAndUpdate() {
        if (!this.metrics) {
            this.initMetricsAndDummyNode();
        }

        const isFixed = this.isFixed;

        const metrics = this.getNodeMetrics();

        const isNodeSizeChanged = (this.metrics.width != metrics.width || this.metrics.height != metrics.height);

        if (isNodeSizeChanged) {
            this.$dummyNode.css({ width: metrics.width + 'px', height: metrics.height + 'px' });
            this.metrics = metrics;
        }

        this.updateFixedState();

        if (isFixed && this.isFixed && isNodeSizeChanged) {
            this.updateNodeCss(this.instanceClass.UPDATE_CSS_TRIGGER_SIZE_CHANGED);
        }
    }

    /**
     * Checks and updates if the block is in the fixed state.
     *
     * @since v1.0.0
     */
    protected updateFixedState() {
        if (!this.metrics) {
            this.initMetricsAndDummyNode();
        }

        const instanceClass = this.instanceClass;
        const isFixed = ($(self).scrollTop() > this.metrics.top);

        const isFixedButHidden = (
            isFixed
            && (
                instanceClass.fixedElements.length > 0
                && instanceClass.fixedElements[0] !== this
                && instanceClass.fixedElements.indexOf(this) > 0
            )
        );

        let triggers = 0;

        if (isFixed) {
            if ((!this.isFixed) || (isFixedButHidden !== this.isFixedButHidden)) {
                if (!this.isFixed) {
                    triggers |= instanceClass.UPDATE_CSS_TRIGGER_FIXED_STATE_CHANGED;
                    instanceClass.fixedElements.unshift(this);

                    if (instanceClass.fixedElements.length > 1) {
                        $(this.element).trigger('xdomchanged');
                    }
                }

                this.isFixed = true;
            }
        } else if (this.isFixed) {
            triggers |= instanceClass.UPDATE_CSS_TRIGGER_FIXED_STATE_CHANGED;
            this.isFixed = false;

            instanceClass.fixedElements = instanceClass.fixedElements.filter(
                (instance: Fixator) => instance !== this
            );

            if (instanceClass.fixedElements.length > 0) {
                $(this.element).trigger('xdomchanged');
            }
        }

        if (isFixedButHidden !== this.isFixedButHidden) {
            triggers |= instanceClass.UPDATE_CSS_TRIGGER_FIXED_HIDDEN_STATE_CHANGED;
            this.isFixedButHidden = isFixedButHidden;
        }

        if (triggers) {
            this.updateNodeCss(triggers);
        }
    }

    /**
     * Updates the block CSS to correspond to the calculated state.
     *
     * @since v1.0.0
     */
    protected updateNodeCss(triggers: number) {
        if (!this.metrics) {
            this.initMetricsAndDummyNode();
        }

        const attributes = { ...this.nodeAttributes };

        if (this.isFixed) {
            const instanceClass = this.instanceClass;

            if (this.isMaximizedIfFixed) {
                attributes['left'] = 0;
                attributes['right'] = 0;
            } else {
                attributes['width'] = `${this.metrics.contentWidth}px`;
                attributes['left'] = `${this.metrics.left}px`;
            }

            if (triggers & instanceClass.UPDATE_CSS_TRIGGER_SIZE_CHANGED) {
                delete attributes['position'];
                delete attributes['top'];
            } else {
                attributes['position'] = 'fixed';
                attributes['top'] = '0px';
            }

            if (
                this.isFixedButHidden
                && (triggers & instanceClass.UPDATE_CSS_TRIGGER_FIXED_HIDDEN_STATE_CHANGED)
            ) {
                attributes['top'] = String(Math.floor(-1 * this.metrics.height)) + 'px';
            }

            if (triggers & instanceClass.UPDATE_CSS_TRIGGER_FIXED_STATE_CHANGED) {
                this.$dummyNode.css('display', 'block');
                this.$node.addClass(this.fixedClass);
            }
        } else {
            this.$dummyNode.css('display', 'none');
            this.$node.removeClass(this.fixedClass);
        }

        this.$node.css(attributes);
    }
}
