sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../utils/Enum",
    'sap/ui/model/Sorter',
    'sap/m/Menu',
    'sap/m/MenuItem',
    'sap/ui/core/Fragment',
    'sap/ui/Device'
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Enum, Sorter, Menu, MenuItem, Fragment, Device) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            this._mViewSettingsDialogs = {};
            // keeps the search state
            this._aTableSearchState = [];
            this.oDRS2 = this.getView().byId("DRS2");

            var dOneMonth = new Date();
            // Set it to one month ago
            dOneMonth.setMonth(dOneMonth.getMonth() - 1);
            // Zero the time component
            dOneMonth.setHours(0, 0, 0, 0);

            this.oDRS2.setDateValue(dOneMonth);
            this.oDRS2.setSecondDateValue(new Date());

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                mass: false
            });
            this.setModel(oViewModel, "worklistView");

            this.oTaskType = this.getView().byId("slName");

            var aUsers = [{DisplayName: 'John', UniqueName: '70006111'},
                {DisplayName: 'Rohan', UniqueName: '50006143'},
                {DisplayName: 'Richard', UniqueName: '60006153'},
                {DisplayName: 'Sam Hopkins', UniqueName: '60006154'},
                {DisplayName: 'Samuel', UniqueName: '60006155'},
                {DisplayName: 'Ramesh', UniqueName: '60006158'},
                {DisplayName: 'Tom Benj', UniqueName: '60006159'}];
            //
            var oViewModel = new JSONModel(aUsers);
            this.setModel(oViewModel, "userModel");


            this.getTaskDefinitions();
            // this.getWorkflowDefinitions();

            formatter.initializeTaskTypeMap();
            this.getRouter().getRoute("worklist").attachPatternMatched(this._onObjectMatched, this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
                //call bar chart
                this.prepareProcessBarData();
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        prepareCompChartData: function () {
            var aRows = this.byId("idProductsTable").getItems();
            var oStatusCountMap = {};
            $.each(aRows, function (i, oRow) {
                let sStatus = oRow.getBindingContext().getObject().Status;
                if (oStatusCountMap[sStatus] !== undefined) {
                    oStatusCountMap[sStatus] = oStatusCountMap[sStatus] + 1;
                } else {
                    oStatusCountMap[sProcessId] = 1;
                }
            });


            var result = [];
            var aColors = ['sapUiChartPaletteSequentialHue1Light3', 'sapUiChartPaletteSemanticGoodLight3', 'sapUiChartPaletteSemanticNeutralLight3'];
            var index = 0;
            for (var i in oStatusCountMap) {
                result.push({
                    "status": i,
                    "count": oProcessCountMap[i],
                    "color": aColors[index]
                });
                index++;
            }
            result.push({
                "status": "Total Tasks",
                "count": aRows.length,
                "color": 'sapUiChartPaletteSemanticNeutralLight3'
            });
            var oStatusCountModel = new JSONModel(result);
            this.setModel(oStatusCountModel, "StatusCountModel")
        },

        onSelectRows: function (oEvent) {
            var rows = oEvent.getSource().getSelectedItems();
            if (rows.length > 1) {
                this.getModel("worklistView").setProperty("/mass", true);
            } else {
                this.getModel("worklistView").setProperty("/mass", false);
            }
        },


        handleSortButtonPressed: function () {
            this.getViewSettingsDialog("com.ncs.btp.buildinbox.fragment.Sort")
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.open();
                });
        },
        handleSortDialogConfirm: function (oEvent) {
            var oTable = this.byId("idProductsTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                sPath,
                bDescending,
                aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));

            // apply the selected sort and group settings
            oBinding.sort(aSorters);
        },

        handleFilterButtonPressed: function () {
            this.getViewSettingsDialog("com.ncs.btp.buildinbox.fragment.FilterDialog")
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.open();
                });
        },

        handleFilterDialogConfirm: function (oEvent) {
            var oTable = this.byId("idProductsTable"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                aFilters = [];

            mParams.filterItems.forEach(function (oItem) {
                var aSplit = oItem.getKey().split("___"),
                    sPath = aSplit[0],
                    sOperator = aSplit[1],
                    sValue1 = aSplit[2],
                    sValue2 = aSplit[3],
                    oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
                aFilters.push(oFilter);
            });

            // apply filter settings
            oBinding.filter(aFilters);

            // update filter bar
            this.byId("vsdFilterBar").setVisible(aFilters.length > 0);
            this.byId("vsdFilterLabel").setText(mParams.filterString);
        },

        getViewSettingsDialog: function (sDialogFragmentName) {
            var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

            if (!pDialog) {
                pDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: sDialogFragmentName,
                    controller: this
                }).then(function (oDialog) {
                    if (Device.system.desktop) {
                        oDialog.addStyleClass("sapUiSizeCompact");
                    }
                    return oDialog;
                });
                this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
            }
            return pDialog;
        },

        onMassAccept: function () {
            var oTable = this.byId("idProductsTable");

            var aSelRows = oTable.getSelectedItems();
            var aTasks = [];
            for (let i = 0; i < aSelRows.length; i++) {
                aTasks.push(aSelRows[i].getBindingContext().getObject().InstanceID);
                //oContextData.InstanceID;
            }

            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();

            let oFuncSuccess = function (data) {
                orderBusyDialog.close();
                if (data.length === aTasks.length) {
                    sap.m.MessageBox.information("Tasks completed");
                } else {
                    sap.m.MessageBox.information("Tasks partially successful");
                }
                this.onRefresh();
            }.bind(this);

            let oFuncError = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.error("Error occurred! \n" + data);
            };

            this.submitTasks(aTasks, "approve").then(oFuncSuccess, oFuncError);


        },
        onMassReject: function () {
            var oTable = this.byId("idProductsTable");

            var aSelRows = oTable.getSelectedItems();
            var aTasks = [];
            for (let i = 0; i < aSelRows.length; i++) {
                aTasks.push(aSelRows[i].getBindingContext().getObject().InstanceID);
                //oContextData.InstanceID;
            }

            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();

            let oFuncSuccess = function (data) {
                orderBusyDialog.close();
                if (data.length === aTasks.length) {
                    sap.m.MessageBox.information("Tasks completed");
                } else {
                    sap.m.MessageBox.information("Tasks partially successful");
                }
                this.onRefresh();
            }.bind(this);

            let oFuncError = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.error("Error occurred! \n" + data);
            };

            this.submitTasks(aTasks, "reject").then(oFuncSuccess, oFuncError);

        },


        submitTasks: function (aTaskIds, sDecision) {
            var aSuccessList = [];
            var aFailedList = [];
            var oPayload = {"status": "COMPLETED", "decision": sDecision};
            return new Promise(function (resolve, reject) {
                $.each(aTaskIds, function (i, sTaskId) {
                    var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskId;
                    this.completeTask(sPath, oPayload).then(function (data) {
                        aSuccessList.push(sTaskId);
                        if (aTaskIds.length - 1 === i) {
                            resolve([aSuccessList, aFailedList]);
                        }
                    }, function (data) {
                        aFailedList.push(sTaskId);
                        if (aTaskIds.length - 1 === i) {
                            resolve([aSuccessList, aFailedList]);
                        }
                    });
                    //     var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskId;
                    //     var oPayload = { "status": "COMPLETED", "decision": sDecision };
                    //     $.ajax({
                    //         url: sPath,
                    //         type: "PATCH",
                    //         data: JSON.stringify(oPayload),
                    //         headers: {
                    //             "X-CSRF-Token": this.TOKEN,
                    //             "Content-Type": "application/json"
                    //         },
                    //         async: false,
                    //         success: function (data) {
                    //             aSuccessList.push(sTaskId);
                    //             //that.navToMainPage();
                    //         },
                    //         error: function (data) {
                    //             aFailedList.push(sTaskId);
                    //             // orderBusyDialog.close();
                    //         }
                    //     });
                }.bind(this));

            }.bind(this));


            // this.onRefresh();
            // orderBusyDialog.close();
            // var sMessage = "";            
            // sMessage = sMessage + aSuccessList.length >0 ? "Success: "+aSuccessList.toString():"";
            // sMessage = sMessage +"/n "+ aFailedList.length >0 ? "Failed:"+aFailedList.toString():"";
            // sap.m.MessageBox.information("Tasks completed! /n "+ sMessage);
            // sap.m.MessageBox.information("Tasks completed!");

        },
        onAccept: function (oEvent) {
            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + oEvent.getSource().getBindingContext().getObject().InstanceID;
            var oPayload = {"status": "COMPLETED", "decision": "approve"};

            let oFuncSuccess = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.information("Task completed");
                this.onRefresh();
            }.bind(this);

            let oFuncError = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.error("Error occurred! \n" + data);
            };

            this.completeTask(sPath, oPayload).then(oFuncSuccess, oFuncError);
        },
        onReject: function (oEvent) {

            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + oEvent.getSource().getBindingContext().getObject().InstanceID;
            var oPayload = {"status": "REWORK", "decision": "reject"};

            let oFuncSuccess = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.information("Task rejected successfully");
                this.onRefresh();
            }.bind(this);

            let oFuncError = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.error("Error occurred! \n" + data);
            };

            this.completeTask(sPath, oPayload).then(oFuncSuccess, oFuncError);

        },

        _onObjectMatched: function (oParam) {
            this.fetchCSRFToken().then(function (sToken) {
                this.TOKEN = sToken;
            }.bind(this));

            this.onRefresh();
            this._setVizFrames();
        },

        _setVizFrames: function () {
            var oVizFrame = this.oVizFrame = this.getView().byId("idVizFrame");
            oVizFrame.setVizProperties({
                plotArea: {
                    dataLabel: {
                        type: "value",
                        visible: true
                    }
                },
                legend: {
                    title: {
                        visible: false
                    }
                },
                title: {
                    visible: true,
                    text: 'Tasks By Status'
                }
            });

            var oVizFrame1 = this.oVizFrame1 = this.getView().byId("idVizFrame1");
            oVizFrame1.setVizProperties({
                plotArea: {
                    dataLabel: {
                        visible: true
                    }
                },
                legend: {
                    visible: false
                },
                valueAxis: {
                    label: {},
                    title: {
                        visible: false
                    }
                },
                categoryAxis: {
                    title: {
                        visible: false
                    }
                },
                title: {
                    visible: true,
                    text: 'Tasks By Process'
                }
            });
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("TaskDefinitionID", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            var oTable = this.byId("idProductsTable");
            oTable.getBinding("items").refresh();
        },

        onFilterSearch: function (oEvent) {
            var oFilterBar = oEvent.getSource();
            var aFilterItems = oFilterBar.getFilterItems();
            var that = this;
            var aFilters = aFilterItems.map(function (oFilterItem) {
                var sFilterName = oFilterItem.getName();
                var oControl = oFilterBar.determineControlByFilterItem(oFilterItem);
                var sControlName = oControl.getMetadata().getName();
                var sValue, dSdate, dEdate, oFilter;
                if (sControlName === "sap.m.Select") {
                    sValue = oControl.getSelectedKey();
                } else if (sControlName === "sap.m.Input") {
                    sValue = oControl.getValue();
                } else if (sControlName === 'sap.m.DateRangeSelection') {
                    dSdate = oControl.getDateValue();
                    dEdate = oControl.getSecondDateValue();
                }

                if (sFilterName === 'TaskDefinitionID' && that.oTaskType.getSelectedItem()) {
                    let oDef = that.oTaskType.getSelectedItem().getBindingContext("WFDefinitionList").getObject();
                    var aFilters = [];
                    for (let oTaskDef of oDef.TaskDefinitions) {
                        aFilters.push(new Filter(sFilterName, FilterOperator.EQ, oTaskDef.TaskDefinitionID));
                    }
                    oFilter = new Filter({
                        filters: aFilters,
                        and: false,
                    });
                } else if (sFilterName === 'CreatedOn' && dSdate) {
                    oFilter = new Filter(sFilterName, FilterOperator.BT,
                        dSdate.toISOString(), dEdate.toISOString());

                } else if (sFilterName === 'CreatedBy' && sValue !== "") {
                    oFilter = new sap.ui.model.Filter(sFilterName, FilterOperator.EQ, sValue);
                }
                return oFilter;
            });

            //remove undefined
            aFilters = aFilters.filter(item => item !== undefined);
            this.byId("idProductsTable").getBinding("items").filter(aFilters);
        },

        onFilterTasks: function (aFilters) {
            var aFilters = [];
            var oTable = this.byId("idProductsTable");
            var aFinalFilter = [];

            let oDef = this.oTaskType.getSelectedItem().getBindingContext("WFDefinitionList").getObject();

            for (let oTaskDef of oDef.TaskDefinitions) {
                aFilters.push(new Filter("TaskDefinitionID", FilterOperator.EQ, oTaskDef.TaskDefinitionID));
            }

            aFinalFilter = new Filter({
                filters: aFilters,
                and: false,
            });

            //date filters
            let dSdate = this.oDRS2.getDateValue();
            let dEdate = this.oDRS2.getSecondDateValue();


            oTable.getBinding("items").filter(aFinalFilter);
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            let sProcess = oItem.getBindingContext().getObject().TaskDefinitionID.split(".")[3];
            let sRoute = "";
            if (sProcess === 'vendorBusinessPartner') {
                sRoute = 'vendor';
            } else if (sProcess === 'customerBusinessPartner') {
                sRoute = 'customer';
            } else if (sProcess === 'salesEmpTagUntagProcess') {
                sRoute = 'sales';
            } else if (sProcess === 'purchaseOrderFlow') { // purchaseOrderFlow
                sRoute = 'po';
            } else if (sProcess === 'documentApprovalVerification') {
                sRoute = 'da';
            } else if (sProcess === 'leaveApproval') {
                sRoute = 'leaveRequest';
            }


            this.getRouter().navTo(sRoute, {
                objectId: oItem.getBindingContext().getPath().substring("/TaskCollection".length)
            });

            // this.getRouter().navTo("vendor", {
            //     objectId: oItem.getBindingContext().getPath().substring("/TaskCollection".length)
            // });


            //component re-use navigation
            // this.getRouter().navTo("detail", {
            //     objectId: oItem.getBindingContext().getPath().substring("/TaskCollection".length)
            // },
            //     {
            //         vendorTarget: {
            //             route: "bpvendObjectPage",
            //             parameters: {
            //                 key: encodeURIComponent('Rootid=005056ac-e463-1edd-b7b2-d2ace18fdd23,IsActiveEntity=true')
            //             }
            //         }
            //     }
            // );


        },

        navtovendor: function () {
            this.getRouter().navTo("detail", {
                    objectId: "(SAP__Origin='NA',InstanceID='b2e6d324-c7ab-11ed-a0c1-eeee0a8daf24')"
                }
            );
        },


        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },
        getTaskContext: function () {
            var appModulePath = this.getModulePath();
            var sPath = appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + 'acfff31b-b5ac-11ec-9b2a-eeee0a81a367' + "/context";
            var contextModel = new sap.ui.model.json.JSONModel(sPath);
            var contextData = contextModel.getData();
        },
        getWFTaskInstances: function (sInstanceId) {
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances?workflowInstanceId=" + sInstanceId

            var oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, true, 'GET'
            );
            this.setModel(oDefModel, "WFTaskInstances");
        },
        getTaskDetails: function (sTaskInstanceId) {
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskInstanceId;
            var oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );
            return oDefModel.getData();
        },

        getTaskDefinitions: function () {
            // TaskDefinitionCollection
            // var sPath =  "bpmworkflowruntime/v1/tcm/TaskDefinitionCollection";
            // this.callRESTService(sPath, "GET", this.TOKEN, function(oResp){
            //     sap.m.MessageToast.show("Task definition data!"+oResp);
            // });
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/TaskDefinitionCollection", {
                success: function (oRetrievedResult) {
                    this.setModel(new JSONModel(oRetrievedResult), "TaskDefinitions");
                    this.getWorkflowDefinitions();
                }.bind(this),
                error: function (oError) { /* do something */
                }
            });
        },

        getWorkflowDefinitions: function () {
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/workflow-definitions";
            var oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );
            this.setModel(oDefModel, "WFDefinitionList");

            let aTaskDefinitions = this.getModel("TaskDefinitions").getData().results;

            let aDefinitions = oDefModel.getData();

            for (let oDef of aDefinitions) {
                let aTaskDefList = [];
                for (let oTaskDef of aTaskDefinitions) {
                    if (oTaskDef.TaskDefinitionID.includes(oDef.id)) {
                        aTaskDefList.push(oTaskDef);
                    }
                }
                oDef["TaskDefinitions"] = aTaskDefList;
            }

        },

        taskAttributeFactory: function (sId, oContext) {

            var customAttributeCtxPath = "/" + oContext.sDeepPath.split("/")[1];
            var taskDefinitionName = this.getModel().getObject(customAttributeCtxPath).TaskDefinitionName;
            var contextObject = oContext.oModel.getProperty(oContext.sPath);
            contextObject.TaskDefinitionName = taskDefinitionName;
            return new sap.m.ObjectAttribute({
                title: {
                    path: "Name",
                    formatter: function (s) {
                        return Enum.TA[s];
                    }
                },
                text: {
                    path: "Value"
                },
                visible: {
                    parts: [{
                        path: "Name"
                    }, {
                        path: "TaskDefinitionName"
                    }],
                    formatter: function (attributeName, tdName) {
                        //return formatter.isAttributeVisible(attributeName, tdName);
                        return true;
                    }
                },
                tooltip: {
                    path: "TaskDefinitionName"
                }
            });
        },
        prepareProcessBarData: function () {
            var aRows = this.byId("idProductsTable").getItems();
            var oProcessCountMap = {};
            var oStatusCountMap = {};
            $.each(aRows, function (i, oRow) {
                //process count
                let sProcessId = oRow.getBindingContext().getObject().TaskDefinitionID.split("@")[1];
                if (oProcessCountMap[sProcessId] !== undefined) {
                    oProcessCountMap[sProcessId] = oProcessCountMap[sProcessId] + 1;
                } else {
                    oProcessCountMap[sProcessId] = 1;
                }

                //status count
                let sStatus = oRow.getBindingContext().getObject().Status;
                if (oStatusCountMap[sStatus] !== undefined) {
                    oStatusCountMap[sStatus] = oStatusCountMap[sStatus] + 1;
                } else {
                    oStatusCountMap[sStatus] = 1;
                }
            });


            var result = [];
            var aColors = ['sapUiChartPaletteSequentialHue1Light3', 'sapUiChartPaletteSemanticGoodLight3', 'sapUiChartPaletteSemanticNeutralLight3'];
            var index = 0;
            for (var i in oProcessCountMap) {
                result.push({
                    "process": i.split(".")[i.split(".").length - 1],
                    "count": oProcessCountMap[i],
                    "color": aColors[index]
                });
                index++;
            }
            // result.push({
            //     "process": "Leave Request",
            //     "count": 3,
            //     "color": aColors[index]
            // })
            var oProcessCountModel = new JSONModel(result);
            this.setModel(oProcessCountModel, "ProcessCountModel");

            //status count model
            var aColors = ['Good', 'Neutral', 'None'];

            index = 0;
            var aStatus = [];
            for (var i in oStatusCountMap) {
                aStatus.push({
                    "status": i,
                    "count": oStatusCountMap[i],
                    "color": aColors[index]
                });
                index++;
            }
            // aStatus.push(
            //     {
            //         "status": "Leave Requests",
            //         "count": 3,
            //         "color": aColors[index]
            //     }
            // )
            // aStatus.unshift({"status":"Total Tasks",
            //         "count": aRows.length,
            //         "color": 'Critical'});
            var oStatusCountModel = new JSONModel(aStatus);
            this.setModel(oStatusCountModel, "StatusCountModel")

            //progress charts
            var iReady = oStatusCountMap["READY"];
            var iInProgress = oStatusCountMap["RESERVED"];
            var oProgress = {
                "READY": iReady !== undefined ? iReady / aRows.length * 100 : 0,
                "RESERVED": iInProgress !== undefined ? iInProgress / aRows.length * 100 : 0
            }

            var oProgressCountModel = new JSONModel(oProgress);
            this.setModel(oProgressCountModel, "ProgressModel")

        },

        setBarChartProps: function () {
            this.prepareProcessBarData();
            var oBar = this.byId("idBar");
            oBar.setVizProperties({
                plotArea: {
                    dataPointStyle: {
                        "rules":
                            [{
                                "dataContext": [{"process": "*poprocess"}],
                                "properties": {"color": "sapUiChartPaletteSequentialHue1"},
                                "displayName": "Running"
                            }, {
                                "dataContext": [{"process": "*leave"}],
                                "properties": {"color": "sapUiChartPaletteSemanticGood"},
                                "displayName": "Completed"
                            }]

                    }
                }
            });
        },
        onManageSubstitutes: function () {
            this.getRouter().navTo("substitutes", {});
        },

        onPressSubstitutesFor: function () {
            if (!this.substituteForDialog) {
                this.substituteForDialog = sap.ui.xmlfragment(
                    "com.ncs.btp.buildinbox.fragment.SubstitutesFor", this);
                this.getView().addDependent(this.substituteForDialog);
            }

            this.substituteForDialog.open();
        },
        closeSubstForDialog: function () {
            if (this.substituteForDialog) {
                this.substituteForDialog.destroy();
                this.substituteForDialog = null;
            }
        },
        onClickProcessDetailsLink: function (oEvent) {
            var sTaskId = oEvent.getSource().getBindingContext().getObject().InstanceID;
            var oTaskDetails = this.getTaskDetails(sTaskId);
            this.getWFTaskInstances(oTaskDetails.workflowInstanceId);

            if (!this._oProcessDisplayDialog) {
                this._oProcessDisplayDialog = sap.ui.xmlfragment("com.ncs.btp.buildinbox.fragment.ProcessDetails", this);
                this.getView().addDependent(this._oProcessDisplayDialog);
                this._oProcessDisplayDialog.setTitle("Process Details");
            }

            this._oProcessDisplayDialog.open();
        },
        closeProcessDetailsDialog: function () {
            if (this._oProcessDisplayDialog) {
                this._oProcessDisplayDialog.destroy();
                this._oProcessDisplayDialog = null;
            }
        },

        onClaimRelease: function (oEvent) {
            var oTask = oEvent.getSource().getBindingContext().getObject();
            var oParam = {SAP__Origin: "'NA'", InstanceID: "'" + oTask.InstanceID + "'"};
            var sPath = "";
            if (oTask.Status === 'READY') {
                sPath = "bpmworkflowruntime/public/workflow/odata/v1/tcm/Claim?";

            } else {
                sPath = "bpmworkflowruntime/public/workflow/odata/v1/tcm/Release?";
            }
            sPath = sPath + jQuery.param(oParam);

            // var sPath =  "bpmworkflowruntime/v1/tcm/Claim?
            this.callRESTService(sPath, "POST", this.TOKEN, function () {
                sap.m.MessageToast.show("Claim Complete!");
                this.onRefresh();
            })
        },
        onForward: function (oEvent) {
            var sTaskId = oEvent.getSource().getBindingContext().getObject().InstanceID;
            // var oTaskDetails = this.getTaskDetails(sTaskId);
            // this.getWFTaskInstances(oTaskDetails.workflowInstanceId);

            if (!this.FORWARDDLG) {
                this.FORWARDDLG = sap.ui.xmlfragment("com.ncs.btp.buildinbox.fragment.Forward", this);
                this.getView().addDependent(this.FORWARDDLG);
                // this.FORWARDDLG.setTitle("Select User");
            }
            this.FORWARDDLG.setModel(new JSONModel({taskID: sTaskId}));
            this.FORWARDDLG.open();
        },
        onPressForward: function (oEvent) {
            var oForwardData = this.FORWARDDLG.getModel().getData();
            var sParams = jQuery.param({
                SAP__Origin: "'NA'",
                InstanceID: "'" + oForwardData.taskID + "'",
                ForwardTo: "'" + oForwardData.UniqueName + "'"
            })
            var sPath = "bpmworkflowruntime/public/workflow/odata/v1/tcm/Forward?" + sParams;
            this.callRESTService(sPath, "POST", this.TOKEN, function () {
                this.closeForwardDialog();
                sap.m.MessageToast.show("Forward Complete!");
            });
        },
        closeForwardDialog: function () {
            if (this.FORWARDDLG) {
                this.FORWARDDLG.destroy();
                this.FORWARDDLG = null;
            }
        },
        handleUserSelectionChange: function (oEvent) {
            var oListItem = oEvent.getParameter("listItem").getBindingContext("userModel").getObject();
            this.FORWARDDLG.getModel().setProperty("/UniqueName", oListItem.UniqueName);
            this.FORWARDDLG.getModel().setProperty("/DisplayName", oListItem.DisplayName)
        }

    });
});
