import React from "react";
import { Spinner } from "react-bootstrap";

const CustomLoader = ({ message = "Loading...", image }) => {
    return (
        <div className="text-center my-4">
            {image ? (
                <img src={image} alt="Loading..." width="100" />
            ) : (
                <Spinner animation="border" variant="primary" />
            )}
            <p className="mt-2">{message}</p>
        </div>
    );
};

export default CustomLoader;
