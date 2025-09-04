import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import NavLeft from "./NavLeft";
import NavRight from "./NavRight";
import { ListGroup, Dropdown, Card } from "react-bootstrap";
import { ConfigContext } from "../../../contexts/ConfigContext";
import * as actionType from "../../../store/actions";
// ==============================|| NAV BAR ||============================== //
const NavBar = () => {
  const [moreToggle, setMoreToggle] = useState(false);
  const configContext = useContext(ConfigContext);
  const { collapseMenu, layout } = configContext.state;
  const { dispatch } = configContext;
  let headerClass = [
    "navbar",
    "pcoded-header",
    "navbar-expand-lg",
    // "header-blue",
    "header-test",
    "headerpos-fixed",
  ];
  if (layout === "vertical") {
    headerClass = [...headerClass, "headerpos-fixed"];
  }
  let toggleClass = ["mobile-menu"];
  if (collapseMenu) {
    toggleClass = [...toggleClass, "on"];
  }
  const navToggleHandler = () => {
    dispatch({ type: actionType.COLLAPSE_MENU });
  };
  let moreClass = ["mob-toggler"];
  let collapseClass = ["collapse navbar-collapse"];
  if (moreToggle) {
    moreClass = [...moreClass, "on"];
    collapseClass = [...collapseClass, "d-block"];
  }
  let navBar = (
    <React.Fragment>
      <div className="m-header">
        <Link
          to="#"
          className={toggleClass.join(" ")}
          id="mobile-collapse"
          onClick={navToggleHandler}
        >
          <span />
        </Link>
        <Link to="#" className="b-brand">
          <h5 className="text-white">Homeopathika</h5>
        </Link>
        {/* notification for mobile */}
        <Link className="d-md-none d-block notificationn-mob" to="#">
          <ListGroup as="ul" bsPrefix=" " className="navbar-nav">
              <ListGroup.Item as="li" bsPrefix=" ">
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as={Link}
                    variant="link"
                    to="#"
                    id="dropdown-basic"
                  >
                    <i className="feather icon-bell icon" />
                    <span className="badge rounded-pill bg-danger">
                      <span />
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    align="end"
                    className="notification notification-scroll"
                  >
                    <div className="noti-head">
                      <h6 className="d-inline-block m-b-0">Notifications</h6>
                      <div className="float-end">
                        <Link
                          to="#"
                          style={{ textDecoration: "none" }}
                          className="m-r-10"
                        >
                          mark as read
                        </Link>
                        <Link style={{ textDecoration: "none" }} to="#">
                          clear all
                        </Link>
                      </div>
                    </div>
                    <div className="noti-footer">
                      <Link to="#">Coming Soon</Link>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              </ListGroup.Item>
              
          </ListGroup>
        </Link>
        <Link
          to="#"
          className={moreClass.join(" ")}
          onClick={() => setMoreToggle(!moreToggle)}
        >
          <i className="feather icon-more-vertical text-white" />
        </Link>
      </div>
      <div
        style={{ justifyContent: "end" }}
        className={collapseClass.join(" ")}
      >
        {/* <NavLeft /> */}
        <NavRight />
      </div>
    </React.Fragment>
  );
  return (
    <React.Fragment>
      <header className={headerClass.join(" ")} style={{ zIndex: 1009 }}>
        {navBar}
      </header>
    </React.Fragment>
  );
};
export default NavBar;