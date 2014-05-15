define(["jquery", "underscore", "js/spec_helpers/create_sinon", "js/spec_helpers/edit_helpers",
    "js/views/feedback_prompt", "js/views/pages/container", "js/models/xblock_info"],
    function ($, _, create_sinon, edit_helpers, Prompt, ContainerPage, XBlockInfo) {

        describe("ContainerPage", function() {
            var lastRequest, renderContainerPage, expectComponents, respondWithHtml,
                model, containerPage, requests,
                mockContainerPage = readFixtures('mock/mock-container-page.underscore'),
                mockContainerXBlockHtml = readFixtures('mock/mock-container-xblock.underscore'),
                mockXBlockEditorHtml = readFixtures('mock/mock-xblock-editor.underscore');

            beforeEach(function () {
                edit_helpers.installEditTemplates();
                appendSetFixtures(mockContainerPage);

                model = new XBlockInfo({
                    id: 'testCourse/branch/draft/block/verticalFFF',
                    display_name: 'Test Unit',
                    category: 'vertical'
                });
                containerPage = new ContainerPage({
                    model: model,
                    templates: edit_helpers.mockComponentTemplates,
                    el: $('#content')
                });
            });

            lastRequest = function() { return requests[requests.length - 1]; };

            respondWithHtml = function(html) {
                var requestIndex = requests.length - 1;
                create_sinon.respondWithJson(
                    requests,
                    { html: html, "resources": [] },
                    requestIndex
                );
            };

            renderContainerPage = function(html, that) {
                requests = create_sinon.requests(that);
                containerPage.render();
                respondWithHtml(html);
            };

            expectComponents = function (container, locators) {
                // verify expected components (in expected order) by their locators
                var components = $(container).find('.studio-xblock-wrapper');
                expect(components.length).toBe(locators.length);
                _.each(locators, function(locator, locator_index) {
                    expect($(components[locator_index]).data('locator')).toBe(locator);
                });
            };

            describe("Basic display", function() {
                it('can render itself', function() {
                    renderContainerPage(mockContainerXBlockHtml, this);
                    expect(containerPage.$el.select('.xblock-header')).toBeTruthy();
                    expect(containerPage.$('.wrapper-xblock')).not.toHaveClass('is-hidden');
                    expect(containerPage.$('.no-container-content')).toHaveClass('is-hidden');
                });
                it('shows a loading indicator', function() {
                    requests = create_sinon.requests(this);
                    containerPage.render();
                    expect(containerPage.$('.ui-loading')).not.toHaveClass('is-hidden');
                    respondWithHtml(mockContainerXBlockHtml);
                    expect(containerPage.$('.ui-loading')).toHaveClass('is-hidden');
                });
            });

            describe("Editing an xblock", function() {
                var newDisplayName = 'New Display Name';

                beforeEach(function () {
                    edit_helpers.installMockXBlock({
                        data: "<p>Some HTML</p>",
                        metadata: {
                            display_name: newDisplayName
                        }
                    });
                });

                afterEach(function() {
                    edit_helpers.uninstallMockXBlock();
                    edit_helpers.cancelModalIfShowing();
                });

                it('can show an edit modal for a child xblock', function() {
                    var editButtons;
                    renderContainerPage(mockContainerXBlockHtml, this);
                    editButtons = containerPage.$('.edit-button');
                    // The container renders six mock xblocks, so there should be an equal number of edit buttons
                    expect(editButtons.length).toBe(6);
                    editButtons.first().click();
                    // Make sure that the correct xblock is requested to be edited
                    expect(lastRequest().url).toBe(
                        '/xblock/locator-component-A1/studio_view'
                    );
                    create_sinon.respondWithJson(requests, {
                        html: mockXBlockEditorHtml,
                        resources: []
                    });
                    expect(edit_helpers.isShowingModal()).toBeTruthy();
                });
            });

            describe("Editing an xmodule", function() {
                var mockXModuleEditor = readFixtures('mock/mock-xmodule-editor.underscore'),
                    newDisplayName = 'New Display Name';

                beforeEach(function () {
                    edit_helpers.installMockXModule({
                        data: "<p>Some HTML</p>",
                        metadata: {
                            display_name: newDisplayName
                        }
                    });
                });

                afterEach(function() {
                    edit_helpers.uninstallMockXModule();
                    edit_helpers.cancelModalIfShowing();
                });

                it('can save changes to settings', function() {
                    var editButtons, modal, mockUpdatedXBlockHtml;
                    mockUpdatedXBlockHtml = readFixtures('mock/mock-updated-xblock.underscore');
                    renderContainerPage(mockContainerXBlockHtml, this);
                    editButtons = containerPage.$('.edit-button');
                    // The container renders six mock xblocks, so there should be an equal number of edit buttons
                    expect(editButtons.length).toBe(6);
                    editButtons.first().click();
                    create_sinon.respondWithJson(requests, {
                        html: mockXModuleEditor,
                        resources: []
                    });

                    modal = $('.edit-xblock-modal');
                    // Click on the settings tab
                    modal.find('.settings-button').click();
                    // Change the display name's text
                    modal.find('.setting-input').text("Mock Update");
                    // Press the save button
                    modal.find('.action-save').click();
                    // Respond to the save
                    create_sinon.respondWithJson(requests, {
                        id: model.id
                    });

                    // Respond to the request to refresh
                    respondWithHtml(mockUpdatedXBlockHtml);

                    // Verify that the xblock was updated
                    expect(containerPage.$('.mock-updated-content').text()).toBe('Mock Update');
                });
            });

            describe("Empty container", function() {
                var mockEmptyContainerXBlockHtml = readFixtures('mock/mock-empty-container-xblock.underscore');

                it('shows the "no children" message', function() {
                    renderContainerPage(mockEmptyContainerXBlockHtml, this);
                    expect(containerPage.$('.no-container-content')).not.toHaveClass('is-hidden');
                    expect(containerPage.$('.wrapper-xblock')).toHaveClass('is-hidden');
                });
            });

            describe("xblock operations", function() {
                var getGroupElement, expectNumComponents,
                    NUM_GROUPS = 2, NUM_COMPONENTS_PER_GROUP = 3, GROUP_TO_TEST = "A",
                    allComponentsInGroup = _.map(
                        _.range(NUM_COMPONENTS_PER_GROUP),
                        function(index) { return 'locator-component-' + GROUP_TO_TEST + (index + 1); }
                    );

                getGroupElement = function() {
                    return containerPage.$("[data-locator='locator-group-" + GROUP_TO_TEST + "']");
                };

                expectNumComponents = function(numComponents) {
                    expect(containerPage.$('.wrapper-xblock.level-element').length).toBe(
                        numComponents * NUM_GROUPS
                    );
                };

                describe("Deleting an xblock", function() {
                    var clickDelete, deleteComponent, deleteComponentWithSuccess,
                        promptSpies;

                    beforeEach(function() {
                        promptSpies = spyOnConstructor(Prompt, "Warning", ["show", "hide"]);
                        promptSpies.show.andReturn(this.promptSpies);
                    });

                    clickDelete = function(componentIndex, clickNo) {

                        // find all delete buttons for the given group
                        var deleteButtons = getGroupElement().find(".delete-button");
                        expect(deleteButtons.length).toBe(NUM_COMPONENTS_PER_GROUP);

                        // click the requested delete button
                        deleteButtons[componentIndex].click();

                        // expect delete confirmation
                        expect(promptSpies.constructor).toHaveBeenCalled();

                        // no components should be deleted yet
                        expectNumComponents(NUM_COMPONENTS_PER_GROUP);

                        // click 'Yes' or 'No' on delete confirmation
                        if (clickNo) {
                            promptSpies.constructor.mostRecentCall.args[0].actions.secondary.click(promptSpies);
                        } else {
                            promptSpies.constructor.mostRecentCall.args[0].actions.primary.click(promptSpies);
                        }
                    };

                    deleteComponent = function(componentIndex) {
                        clickDelete(componentIndex);
                        create_sinon.respondWithJson(requests, {});

                        // expect request URL to contain given component's id
                        expect(lastRequest().url).toMatch(
                            new RegExp("locator-component-" + GROUP_TO_TEST + (componentIndex + 1))
                        );
                    };

                    deleteComponentWithSuccess = function(componentIndex) {
                        deleteComponent(componentIndex);

                        // verify the new list of components within the group
                        expectComponents(
                            getGroupElement(),
                            _.without(allComponentsInGroup, allComponentsInGroup[componentIndex])
                        );
                    };

                    it("can delete the first xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        deleteComponentWithSuccess(0);
                    });

                    it("can delete a middle xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        deleteComponentWithSuccess(1);
                    });

                    it("can delete the last xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        deleteComponentWithSuccess(NUM_COMPONENTS_PER_GROUP - 1);
                    });

                    it('does not delete when clicking No in prompt', function () {
                        var numRequests;

                        renderContainerPage(mockContainerXBlockHtml, this);
                        numRequests = requests.length;

                        // click delete on the first component but press no
                        clickDelete(0, true);

                        // all components should still exist
                        expectComponents(getGroupElement(), allComponentsInGroup);

                        // no requests should have been sent to the server
                        expect(requests.length).toBe(numRequests);
                    });

                    it('shows a notification during the delete operation', function() {
                        var notificationSpy = edit_helpers.createNotificationSpy();
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickDelete(0);
                        edit_helpers.verifyNotificationShowing(notificationSpy, /Deleting/);
                        create_sinon.respondWithJson(requests, {});
                        edit_helpers.verifyNotificationHidden(notificationSpy);
                    });

                    it('does not delete an xblock upon failure', function () {
                        var notificationSpy = edit_helpers.createNotificationSpy();
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickDelete(0);
                        edit_helpers.verifyNotificationShowing(notificationSpy, /Deleting/);
                        create_sinon.respondWithError(requests);
                        edit_helpers.verifyNotificationShowing(notificationSpy, /Deleting/);
                    });
                });

                describe("Duplicating an xblock", function() {
                    var clickDuplicate, duplicateComponentWithResponse, duplicateComponentWithSuccess,
                        refreshXBlockSpies;

                    beforeEach(function() {
                        refreshXBlockSpies = spyOn(containerPage, "refreshXBlock");
                    });

                    clickDuplicate = function(componentIndex) {

                        // find all duplicate buttons for the given group
                        var duplicateButtons = getGroupElement().find(".duplicate-button");
                        expect(duplicateButtons.length).toBe(NUM_COMPONENTS_PER_GROUP);

                        // click the requested duplicate button
                        duplicateButtons[componentIndex].click();
                    };

                    duplicateComponentWithResponse = function(componentIndex, responseCode) {
                        var request;

                        // click duplicate button for given component
                        clickDuplicate(componentIndex);

                        // verify content of request
                        request = lastRequest();
                        expect(request.url).toEqual("/xblock");
                        expect(request.method).toEqual("POST");
                        expect(JSON.parse(request.requestBody)).toEqual(
                            JSON.parse(
                                '{' +
                                    '"duplicate_source_locator": "locator-component-' + GROUP_TO_TEST + (componentIndex + 1) + '",' +
                                    '"parent_locator": "locator-group-' + GROUP_TO_TEST +
                                    '"}'
                            )
                        );

                        // send the response
                        request.respond(
                            responseCode,
                            { "Content-Type": "application/json" },
                            JSON.stringify({'locator': 'locator-duplicated-component'})
                        );
                    };

                    duplicateComponentWithSuccess = function(componentIndex) {

                        // duplicate component with an 'OK' response code
                        duplicateComponentWithResponse(componentIndex, 200);

                        // expect parent container to be refreshed
                        expect(refreshXBlockSpies).toHaveBeenCalled();
                    };

                    it("can duplicate the first xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        duplicateComponentWithSuccess(0);
                    });

                    it("can duplicate a middle xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        duplicateComponentWithSuccess(1);
                    });

                    it("can duplicate the last xblock", function() {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        duplicateComponentWithSuccess(NUM_COMPONENTS_PER_GROUP - 1);
                    });

                    it('shows a notification when duplicating', function () {
                        var notificationSpy = edit_helpers.createNotificationSpy();
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickDuplicate(0);
                        edit_helpers.verifyNotificationShowing(notificationSpy, /Duplicating/);
                        create_sinon.respondWithJson(requests, {"locator": "new_item"});
                        edit_helpers.verifyNotificationHidden(notificationSpy);
                    });

                    it('does not duplicate an xblock upon failure', function () {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        duplicateComponentWithResponse(0, 500);
                        expectComponents(getGroupElement(), allComponentsInGroup);
                        expect(refreshXBlockSpies).not.toHaveBeenCalled();
                    });
                });

                describe('createNewComponent ', function () {
                    var clickNewComponent, verifyComponents;

                    clickNewComponent = function (index) {
                        containerPage.$(".new-component .new-component-type a.single-template")[index].click();
                    };

                    it('sends the correct JSON to the server', function () {
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickNewComponent(0);
                        edit_helpers.verifyXBlockRequest(requests,
                            '{"category": "discussion", "type": "discussion", "parent_locator": "locator-group-A"}');
                    });

                    it('shows a notification while creating', function () {
                        var notificationSpy = edit_helpers.createNotificationSpy();
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickNewComponent(0);
                        edit_helpers.verifyNotificationShowing(notificationSpy, /Adding/);
                        create_sinon.respondWithJson(requests, { });
                        edit_helpers.verifyNotificationHidden(notificationSpy);
                    });

                    it('does not insert component upon failure', function () {
                        var requestCount;
                        renderContainerPage(mockContainerXBlockHtml, this);
                        clickNewComponent(0);
                        requestCount = requests.length;
                        create_sinon.respondWithError(requests);
                        // No new requests should be made to refresh the view
                        expect(requests.length).toBe(requestCount);
                    });

                    describe('Template Picker', function() {
                        var showTemplatePicker,
                            mockXBlockHtml = readFixtures('mock/mock-xblock.underscore');

                        showTemplatePicker = function() {
                            containerPage.$('.new-component .new-component-type a.multiple-templates')[0].click();
                        };

                        it('can add an HTML component without a template', function() {
                            var xblockCount;
                            renderContainerPage(mockContainerXBlockHtml, this);
                            showTemplatePicker();
                            xblockCount = containerPage.$('.studio-xblock-wrapper').length;
                            containerPage.$('.new-component-html a')[0].click();
                            edit_helpers.verifyXBlockRequest(requests,
                                '{"category": "html", "parent_locator": "locator-group-A"}');
                            create_sinon.respondWithJson(requests, {"locator": "new_item"});
                            respondWithHtml(mockXBlockHtml);
                            expect(containerPage.$('.studio-xblock-wrapper').length).toBe(xblockCount + 1);
                        });

                        it('can add an HTML component with a template', function() {
                            var xblockCount;
                            renderContainerPage(mockContainerXBlockHtml, this);
                            showTemplatePicker();
                            xblockCount = containerPage.$('.studio-xblock-wrapper').length;
                            containerPage.$('.new-component-html a')[1].click();
                            edit_helpers.verifyXBlockRequest(requests,
                                '{"category": "html", "boilerplate" : "announcement.yaml", "parent_locator": "locator-group-A"}');
                            create_sinon.respondWithJson(requests, {"locator": "new_item"});
                            respondWithHtml(mockXBlockHtml);
                            expect(containerPage.$('.studio-xblock-wrapper').length).toBe(xblockCount + 1);
                        });
                    });
                });
            });
        });
    });
