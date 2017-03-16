/* eslint "react/prop-types": "warn" */
import React, { Component, PropTypes } from "react";

import SetupMessage from "./SetupMessage.jsx";
import ModalContent from "metabase/components/ModalContent.jsx";

export default class SetupModal extends Component {
    static propTypes = {
        onClose: PropTypes.func.isRequired,
        user: PropTypes.object.isRequired
    };

    render() {
        return (
            <ModalContent
                onClose={this.props.onClose}
                title={`To send pulses, ${ this.props.user.is_superuser ? "you'll need" : "an admin needs"} to set up email or Glip  integration.`}
            >
                <SetupMessage user={this.props.user} />
            </ModalContent>
        );
    }
}
