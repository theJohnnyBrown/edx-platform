define([ "jquery", "js/spec_helpers/create_sinon", "squire", "URI", "js/views/asset",
    "js/views/assets", "js/views/paging", "js/views/paging_header", "js/views/paging_footer",
    "js/models/asset", "js/collections/asset" ],
    function ($, create_sinon, Squire, URI, AssetView, AssetsView, PagingView, PagingHeader, PagingFooter,
              AssetModel, AssetCollection) {

        describe("Assets", function() {
            var assetsViewVar, mockEmptyAssetsResponse, mockAssetUploadResponse;

            var assetLibraryTpl, assetTpl, pagingFooterTpl, pagingHeaderTpl, uploadModalTpl;
            assetLibraryTpl = readFixtures('asset-library.underscore');
            assetTpl = readFixtures('asset.underscore');
            pagingHeaderTpl = readFixtures('paging-header.underscore');
            pagingFooterTpl = readFixtures('paging-footer.underscore');
            uploadModalTpl = readFixtures('asset-upload-modal.underscore');

            beforeEach(function () {
                setFixtures($("<script>", { id: "asset-library-tpl", type: "text/template" }).text(assetLibraryTpl));
                appendSetFixtures($("<script>", { id: "asset-tpl", type: "text/template" }).text(assetTpl));
                appendSetFixtures($("<script>", { id: "paging-header-tpl", type: "text/template" }).text(pagingHeaderTpl));
                appendSetFixtures($("<script>", { id: "paging-footer-tpl", type: "text/template" }).text(pagingFooterTpl));
                appendSetFixtures(uploadModalTpl);
                appendSetFixtures(sandbox({ id: "asset_table_body" }));

                var collection = new AssetCollection();
                collection.url = "assets-url";
                assetsViewVar = new AssetsView({
                    collection: collection,
                    el: $('#asset_table_body')
                });
                assetsViewVar.render();
            });

            this.mockAsset = {
                display_name: "dummy.jpg",
                url: 'actual_asset_url',
                portable_url: 'portable_url',
                date_added: 'date',
                thumbnail: null,
                locked: false,
                id: 'id_1'
            };

            mockEmptyAssetsResponse = {
                assets: [],
                start: 0,
                end: 0,
                page: 0,
                pageSize: 5,
                totalCount: 0
            };

            mockAssetUploadResponse = {
                asset: this.mockAsset,
                msg: "Upload completed"
            };

            $.fn.fileupload = function() {
                return '';
            };

            var event = {}
            event.target = {"value": "dummy.jpg"};

            describe("AssetsView", function () {
                var setup;
                setup = function() {
                    var requests;
                    requests = create_sinon.requests(this);
                    assetsViewVar.setPage(0);
                    create_sinon.respondWithJson(requests, mockEmptyAssetsResponse);
                    return requests;
                };

                beforeEach(function () {
                    window.analytics = jasmine.createSpyObj('analytics', ['track'])
                    window.course_location_analytics = jasmine.createSpy()
                });

                afterEach(function () {
                    delete window.analytics;
                    delete window.course_location_analytics;
                });

                it('shows the upload modal when clicked on "Upload your first asset" button', function () {
                    expect(assetsViewVar).toBeDefined();
                    appendSetFixtures('<div class="ui-loading"/>');
                    expect($('.ui-loading').is(':visible')).toBe(true);
                    expect($('.upload-button').is(':visible')).toBe(false);
                    setup.call(this);
                    expect($('.ui-loading').is(':visible')).toBe(false);
                    expect($('.upload-button').is(':visible')).toBe(true);

                    expect($('.upload-modal').is(':visible')).toBe(false);
                    $('a:contains("Upload your first asset")').click();
                    expect($('.upload-modal').is(':visible')).toBe(true);

                    $('.close-button').click()
                    expect($('.upload-modal').is(':visible')).toBe(false);
                });

                it('uploads file properly', function () {
                    var requests = setup.call(this);
                    expect(assetsViewVar).toBeDefined();
                    spyOn(assetsViewVar, "addAsset").andCallFake(function () {
                        assetsViewVar.collection.add(mockAssetUploadResponse.asset)
                        assetsViewVar.renderPageItems()
                        assetsViewVar.setPage(0);
                    });

                    $('a:contains("Upload your first asset")').click();
                    expect($('.upload-modal').is(':visible')).toBe(true);

                    $('.choose-file-button').click()
                    $("input[type=file]").change()
                    expect($('.upload-modal h1').text()).toContain("Uploading")

                    assetsViewVar.showUploadFeedback(event, 100)
                    expect($('div.progress-bar').text()).toContain("100%")

                    assetsViewVar.displayFinishedUpload(mockAssetUploadResponse)
                    expect($('div.progress-bar').text()).toContain("Upload completed")
                    $('.close-button').click()
                    expect($('.upload-modal').is(':visible')).toBe(false);

                    expect($('#asset_table_body').html()).toContain("dummy.jpg")
                    expect(assetsViewVar.collection.length).toBe(1)
                });
            });
        });
    });
