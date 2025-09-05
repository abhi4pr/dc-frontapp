import React from "react";
import { Modal, Button } from "react-bootstrap";
import { GoAlertFill } from "react-icons/go";


const Reachedlimit = ({ show, handleClose }) => {
  const handleUpgrade = () => {
    handleClose();
    window.location.href = "/plans"; 
  };
  return (
    <>
      <style>
        {`
          .upgrade-primary {
            background: linear-gradient(181deg, rgb(10, 87, 87), rgb(0, 168, 165));
            color: white !important;
            box-shadow: 0 8px 30px rgba(106, 90, 205, 0.12);
            border: none !important;
            transition: all 0.2s ease-in-out;
          }
          .upgrade-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 40px rgba(106, 90, 205, 0.18);
          }
          .upgrade-primary:active {
            transform: translateY(0);
          }
        `}
      </style>

      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        centered
      >
       
        <Modal.Body>
          <GoAlertFill className="d-block f-30 mb-2 w-100 text-center" />

          <p className="mb-0 w-75 text-center mx-auto">You’ve reached your limit. To continue, please upgrade your plan.</p> 
        </Modal.Body>
          <Modal.Footer className="border-0 justify-content-center mb-3">
            <Button className="upgrade-primary" onClick={handleUpgrade}>
              Upgrade plan
            </Button>
          </Modal.Footer>
      </Modal>
    </>
  );
};

export default Reachedlimit;
