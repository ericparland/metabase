import React, { Component, PropTypes } from "react";

import MetabaseAnalytics from "metabase/lib/analytics";
import MetabaseUtils from "metabase/lib/utils";
import SettingsSetting from "./SettingsSetting.jsx";

import Icon from "metabase/components/Icon.jsx";

import RetinaImage from "react-retina-image";

import cx from "classnames";
import _ from "underscore";

export default class SettingsGlipForm extends Component {

    constructor(props, context) {
        super(props, context);

        this.state = {
            formData: {},
            submitting: "default",
            valid: false,
            validationErrors: {}
        }
    }

    static propTypes = {
        elements: PropTypes.array,
        formErrors: PropTypes.object,
        updateGlipSettings: PropTypes.func.isRequired
    };

    componentWillMount() {
        // this gives us an opportunity to load up our formData with any existing values for elements
        let formData = {};
        this.props.elements.forEach(function(element) {
            formData[element.key] = element.value == null ? element.defaultValue : element.value;
        });

        this.setState({formData});
    }

    componentDidMount() {
        this.validateForm();
    }

    componentDidUpdate() {
        this.validateForm();
    }

    setSubmitting(submitting) {
        this.setState({submitting});
    }

    setFormErrors(formErrors) {
        this.setState({formErrors});
    }

    // return null if element passes validation, otherwise return an error message
    validateElement([validationType, validationMessage], value, element) {
        if (MetabaseUtils.isEmpty(value)) return;

        switch (validationType) {
            case "email":
                return !MetabaseUtils.validEmail(value) ? (validationMessage || "That's not a valid email address") : null;
            case "integer":
                return isNaN(parseInt(value)) ? (validationMessage || "That's not a valid integer") : null;
        }
    }

    validateForm() {
        let { elements } = this.props;
        let { formData } = this.state;

        let valid = true,
            validationErrors = {};

        elements.forEach(function(element) {
            // test for required elements
            if (element.required && MetabaseUtils.isEmpty(formData[element.key])) {
                valid = false;
            }

            if (element.validations) {
                element.validations.forEach(function(validation) {
                    validationErrors[element.key] = this.validateElement(validation, formData[element.key], element);
                    if (validationErrors[element.key]) valid = false;
                }, this);
            }
        }, this);

        if (this.state.valid !== valid || !_.isEqual(this.state.validationErrors, validationErrors)) {
            this.setState({ valid, validationErrors });
        }
    }

    handleChangeEvent(element, value, event) {
        this.setState({
            formData: { ...this.state.formData, [element.key]: (MetabaseUtils.isEmpty(value)) ? null : value }
        });

        if (element.key === "metabot-enabled") {
            MetabaseAnalytics.trackEvent("Glip Settings", "Toggle Metabot", value);
        }
    }

    handleFormErrors(error) {
        // parse and format
        let formErrors = {};
        if (error.data && error.data.message) {
            formErrors.message = error.data.message;
        } else {
            formErrors.message = "Looks like we ran into some problems";
        }

        if (error.data && error.data.errors) {
            formErrors.elements = error.data.errors;
        }

        return formErrors;
    }
//TODO: add glip!
    updateGlipSettings(e) {
        e.preventDefault();

        this.setState({
            formErrors: null,
            submitting: "working"
        });

        let { formData, valid } = this.state;

        if (valid) {
            this.props.updateGlipSettings(formData).then(() => {
                this.setState({
                    submitting: "success"
                });

                MetabaseAnalytics.trackEvent("Glip Settings", "Update", "success");

                // show a confirmation for 3 seconds, then return to normal
                setTimeout(() => this.setState({submitting: "default"}), 3000);
            }, (error) => {
                this.setState({
                    submitting: "default",
                    formErrors: this.handleFormErrors(error)
                });

                MetabaseAnalytics.trackEvent("Glip Settings", "Update", "error");
            });
        }
    }

    render() {
        let { elements } = this.props;
        let { formData, formErrors, submitting, valid, validationErrors } = this.state;

        let settings = elements.map((element, index) => {
            // merge together data from a couple places to provide a complete view of the Element state
            let errorMessage = (formErrors && formErrors.elements) ? formErrors.elements[element.key] : validationErrors[element.key];
            let value = formData[element.key] == null ? element.defaultValue : formData[element.key];

            return (
                            <SettingsSetting
                                key={element.key}
                                setting={{ ...element, value }}
                                updateSetting={this.handleChangeEvent.bind(this, element)}
                                errorMessage={errorMessage}
                            />
                   );

        });

        let saveSettingsButtonStates = {
            default: "Save changes",
            working: "Saving...",
            success: "Changes saved!"
        };

        let disabled = (!valid || submitting !== "default"),
            saveButtonText = saveSettingsButtonStates[submitting];

        return (
            <form noValidate>
                <div className="px2" style={{maxWidth: "585px"}}>
                    <h1>
                        Metabase
                        <RetinaImage
                            className="mx1"
                            src="/app/img/slack_emoji.png"
                            width={79}
                            forceOriginalDimensions={false /* broken in React v0.13 */}
                        />
                        Glip
                    </h1>
                    <h3 className="text-grey-1">Answers sent right to your Glip Teams</h3>

                    <div className="pt3">
                        <a href="https://glip.com/" target="_blank" className="Button Button--primary" style={{padding:0}}>
                            <div className="float-left py2 pl2">Sign up for Glip</div>
                            <Icon className="float-right p2 text-white cursor-pointer" style={{opacity:0.6}} name="external" size={18}/>
                        </a>
                    </div>

                </div>
                <ul>
                    {settings}
                    <li className="m2 mb4">
                        <button className={cx("Button mr2", {"Button--primary": !disabled}, {"Button--success-new": submitting === "success"})} disabled={disabled} onClick={this.updateGlipSettings.bind(this)}>
                            {saveButtonText}
                        </button>
                        { formErrors && formErrors.message ? <span className="pl2 text-error text-bold">{formErrors.message}</span> : null}
                    </li>
                </ul>
            </form>
        );
    }
}