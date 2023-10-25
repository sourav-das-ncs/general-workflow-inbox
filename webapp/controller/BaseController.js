sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library"
], function (Controller, UIComponent, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    var aUrls = {
        URL_TASK: "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/"
    };

    return Controller.extend("com.ncs.btp.buildinbox.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */

        getModulePath: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },

        getUrlPath: function (sUrl) {
            return this.getModulePath() + aUrls[sUrl];
        },

        callRESTService: function (sPath, sMethod, sCSRFToken, fnSuccess) {
            $.ajax({
                url: sPath,
                type: sMethod,
                data: {},
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    "Content-Type": "application/json"
                },
                async: false,
                success: fnSuccess,
                error: function (data) {

                }
            });
        },

        fetchCSRFToken: function () {
            return new Promise(function (resolve, reject) {
                // var xsrfToken = "";
                $.ajax({
                    url: this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/xsrf-token",
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "Fetch"
                    },
                    success: function (result, xhr, data) {
                        //this.TOKEN = data.getResponseHeader("X-CSRF-Token");
                        // xsrfToken = data.getResponseHeader("X-CSRF-Token");
                        resolve(data.getResponseHeader("X-CSRF-Token"));
                    }.bind(this)
                });

            }.bind(this));
            // return xsrfToken;
        },

        completeTask: function (sPath, oPayload) {
            return new Promise(function (resolve, reject) {
                this.fetchCSRFToken().then(function (sToken) {
                    $.ajax({
                        url: sPath,
                        type: "PATCH",
                        data: JSON.stringify(oPayload),
                        headers: {
                            "X-CSRF-Token": sToken,
                            "Content-Type": "application/json"
                        },
                        async: false,
                        success: function (result) {
                            resolve("Task completed");
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                }.bind(this));
            }.bind(this));
        },

        getCurrentTimeInDurationFormat: function () {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');

            return `PT${hours}H${minutes}M${seconds}S`;
        }



    });

});