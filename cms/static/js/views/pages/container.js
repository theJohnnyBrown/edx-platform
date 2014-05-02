/**
 * XBlockContainerPage is used to display Studio's container page for an xblock which has children.
 * This page allows the user to understand and manipulate the xblock and its children.
 */
define(["jquery", "underscore", "gettext", "js/views/feedback_notification",
    "js/views/baseview", "js/views/container", "js/views/xblock", "js/views/components/add_xblock",
    "js/views/modals/edit_xblock", "js/models/xblock_info"],
    function ($, _, gettext, NotificationView, BaseView, ContainerView, XBlockView, AddXBlockComponent,
              EditXBlockModal, XBlockInfo) {

        var XBlockContainerPage = BaseView.extend({
            // takes XBlockInfo as a model

            view: 'container_preview',

            initialize: function() {
                BaseView.prototype.initialize.call(this);
                this.noContentElement = this.$('.no-container-content');
                this.xblockView = new ContainerView({
                    el: this.$('.wrapper-xblock'),
                    model: this.model,
                    view: this.view
                });
            },

            render: function(options) {
                var self = this,
                    noContentElement = this.noContentElement,
                    xblockView = this.xblockView,
                    loadingElement = this.$('.ui-loading');
                loadingElement.removeClass('is-hidden');

                // Hide both blocks until we know which one to show
                noContentElement.addClass('is-hidden');
                xblockView.$el.addClass('is-hidden');

                // Add actions to any top level buttons, e.g. "Edit" of the container itself
                self.addButtonActions(this.$el);

                // Render the xblock
                xblockView.render({
                    success: function(xblock) {
                        if (xblockView.hasChildXBlocks()) {
                            xblockView.$el.removeClass('is-hidden');
                            self.renderAddXBlockComponents();
                            self.onXBlockRefresh(xblockView);
                        } else {
                            noContentElement.removeClass('is-hidden');
                        }
                        loadingElement.addClass('is-hidden');
                        self.delegateEvents();
                    }
                });
            },

            findXBlockElement: function(target) {
                return $(target).closest('.studio-xblock-wrapper');
            },

            getURLRoot: function() {
                return this.xblockView.model.urlRoot;
            },

            onXBlockRefresh: function(xblockView) {
                this.addButtonActions(xblockView.$el);
                this.xblockView.refresh();
            },

            renderAddXBlockComponents: function() {
                var self = this;
                this.$('.add-xblock-component').each(function(index, element) {
                    var component = new AddXBlockComponent({
                        el: element,
                        createComponent: _.bind(self.createComponent, self),
                        collection: self.options.templates
                    });
                    component.render();
                });
            },

            addButtonActions: function(element) {
                var self = this;
                element.find('.edit-button').click(function(event) {
                    var modal,
                        target = event.target,
                        xblockElement = self.findXBlockElement(target);
                    event.preventDefault();
                    modal = new EditXBlockModal({ });
                    modal.edit(xblockElement, self.model,
                        {
                            refresh: function(xblockInfo) {
                                self.refreshXBlock(xblockInfo, xblockElement);
                            }
                        });
                });
                element.find('.duplicate-button').click(function(event) {
                    event.preventDefault();
                    self.duplicateComponent(
                        self.findXBlockElement(event.target)
                    );
                });
                element.find('.delete-button').click(function(event) {
                    event.preventDefault();
                    self.deleteComponent(
                        self.findXBlockElement(event.target)
                    );
                });
            },

            createComponent: function(template, target) {
                var parentElement = this.findXBlockElement(target),
                    parentLocator = parentElement.data('locator'),
                    buttonPanel = parentElement.find('.add-xblock-component'),
                    listPanel = buttonPanel.prev(),
                    newElement = $('<li></li>').appendTo(listPanel);
                return this.createAndRenderXBlock(newElement,
                    _.extend(template,
                        {
                            parent_locator: parentLocator
                        }),
                    this.getScrollOffset(buttonPanel));
            },

            duplicateComponent: function(xblockElement) {
                var self = this,
                    parentElement = self.findXBlockElement(xblockElement.parent());
                this.runOperationShowingMessage(gettext('Duplicating&hellip;'),
                    function() {
                        var newElement = $('<li></li>').insertAfter(xblockElement);
                        return self.createAndRenderXBlock(newElement,
                            {
                                duplicate_source_locator: xblockElement.data('locator'),
                                parent_locator: parentElement.data('locator')
                            },
                            self.getScrollOffset(xblockElement));
                    });
            },

            /**
             * Creates a new child xblock instance based upon the supplied xblock info.
             * It then replaces the specified element with the rendering of the new xblock.
             * @param xblockElement The element into which to render the xblock.
             * @param requestData The data to be supplied to the xblock.
             * @param scrollOffset: The scroll offset for the new element.
             */
            createAndRenderXBlock: function(xblockElement, requestData, scrollOffset) {
                var self = this;
                return $.postJSON(this.getURLRoot(), requestData,
                    function(data) {
                        var locator = data.locator,
                            xblockInfo = new XBlockInfo({
                                id: locator
                            });
                        self.setScrollOffset(xblockElement, scrollOffset);
                        self.refreshXBlock(xblockInfo, xblockElement);
                    });
            },

            deleteComponent: function(xblockElement) {
                var self = this;
                this.confirmThenRunOperation(gettext('Delete this component?'),
                    gettext('Deleting this component is permanent and cannot be undone.'),
                    gettext('Yes, delete this component'),
                    function() {
                        self.runOperationShowingMessage(gettext('Deleting&hellip;'),
                            function() {
                                return $.ajax({
                                    type: 'DELETE',
                                    url: self.getURLRoot() + "/" +
                                        xblockElement.data('locator') + "?" +
                                        $.param({recurse: true, all_versions: true})
                                }).success(function() {
                                    xblockElement.remove();
                                });
                            });
                    });
            },

            refreshXBlock: function(xblockInfo, xblockElement) {
                var self = this,
                    temporaryView;

                // There is only one Backbone view created on the container page, which is
                // for the container xblock itself. Any child xblocks rendered inside the
                // container do not get a Backbone view. Thus, create a temporary view
                // to render the content, and then replace the child element with the result.
                temporaryView = new XBlockView({
                    model: xblockInfo,
                    view: 'container_child_preview'
                });
                temporaryView.render({
                    success: function() {
                        self.onXBlockRefresh(temporaryView);
                        xblockElement.replaceWith(temporaryView.$el.find('.studio-xblock-wrapper'));
                        temporaryView.unbind();  // Remove the temporary view
                    }
                });
            }
        });

        return XBlockContainerPage;
    }); // end define();
