import React from "react";

// react-bootstrap
import { Card } from "react-bootstrap";

// ==============================|| ORDER CARD ||============================== //

const OrderCard = ({ params }) => {
  let cardClass = ["order-card"];
  if (params.class) {
    cardClass = [...cardClass, params.class];
  }

  // Check if icon is a React component or CSS class string
  const isReactIcon = React.isValidElement(params.icon);

  let iconClass = ["float-start"];
  if (params.icon && !isReactIcon) {
    iconClass = [...iconClass, params.icon];
  }

  return (
    <Card className={cardClass.join(" ")}>
      <Card.Body>
        <h6 className="text-white">{params.title}</h6>
        <h2 className="text-end text-white">
          {isReactIcon ? (
            <span
              className="float-start"
              style={{ marginRight: "10px", marginTop: "5px" }}
            >
              {params.icon}
            </span>
          ) : (
            <i className={iconClass.join(" ")} />
          )}
          <span>{params.primaryText}</span>
        </h2>
        <p className="mb-0">
          {params.secondaryText}
          <span className="float-end">{params.extraText}</span>
        </p>
      </Card.Body>
    </Card>
  );
};

export default OrderCard;
