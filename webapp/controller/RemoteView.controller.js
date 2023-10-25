sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.RemoteView", {

        /**
         * Navigates to the worklist when the link is pressed
         * @public
         */
        onInit : function () {
            // apply content density mode to root view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }

    });

});