import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { ListGroup, Dropdown, Card } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import avatar1 from "../../../../assets/images/user/avatar-1.jpg";
import avatar2 from "../../../../assets/images/user/avatar-2.jpg";
import avatar3 from "../../../../assets/images/user/avatar-3.jpg";
import avatar4 from "../../../../assets/images/user/avatar-4.jpg";
import profileLogoWhite from "../../../../assets/images/profile-logo-white.svg";
import profileLogoBlack from "../../../../assets/images/profile-logo-black.svg";
import { UserContext } from "../../../../contexts/UserContext";


const NavRight = () => {
  const [listOpen, setListOpen] = useState(false);
  const [doctorData, setDoctorData] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useContext(UserContext);

  const notiData = [
    {
      name: "Joseph William",
      image: avatar2,
      details: "Purchase New Theme and make payment",
      activity: "30 min",
    },
    {
      name: "Sara Soudein",
      image: avatar3,
      details: "currently login",
      activity: "30 min",
    },
    {
      name: "Suzen",
      image: avatar4,
      details: "Purchase New Theme and make payment",
      activity: "yesterday",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <React.Fragment>
      {/* for desktop section */}
      {!isMobile && (
        <>
          <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto">
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

            <ListGroup.Item as="li" bsPrefix=" ">
              <Dropdown align="end" className="drp-user">
                <Dropdown.Toggle
                  as={Link}
                  variant="link"
                  to="#"
                  id="dropdown-basic"
                >
                  <img
                      src={user?.profile_pic || profileLogoWhite}
                      className="img-radius wid-40"
                      alt="User Profile1"
                    />
                  
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" className="profile-notification">
                  <div className="pro-head">
                    <img
                      src={user?.profile_pic || profileLogoWhite}
                      className="img-radius wid-40"
                      alt="User Profile2"
                    />
                    <span>{user?.name}</span>
                  </div>
                  <ListGroup
                    as="ul"
                    bsPrefix=" "
                    variant="flush"
                    className="pro-body"
                  >
                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link to="#" className="dropdown-item">
                        <i className="feather icon-settings" /> Settings
                      </Link>
                    </ListGroup.Item>
                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link to="/profile" className="dropdown-item">
                        <i className="feather icon-user" /> Profile
                      </Link>
                    </ListGroup.Item>

                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link className="dropdown-item" onClick={handleLogout}>
                        <i className="feather icon-log-out" /> Logout
                      </Link>
                    </ListGroup.Item>
                  </ListGroup>
                </Dropdown.Menu>
              </Dropdown>
            </ListGroup.Item>
          </ListGroup>
        </>
      )}

      {/* for mobile section */}
       {isMobile && (
       <>
       <div className="drp-user">
          <div className="profile-notification-mob">
              <div className="pro-head">
                    <img
                      src={user?.profile_pic || profileLogoWhite}
                      className="img-radius wid-40"
                      alt="User Profile2"
                    />
                    <span>{user?.name}</span>
                  </div>
                  <ListGroup
                    as="ul"
                    bsPrefix=" "
                    variant="flush"
                    className="pro-body"
                  >
                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link to="#" className="dropdown-item">
                        <i className="feather icon-settings" /> Settings
                      </Link>
                    </ListGroup.Item>
                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link to="/profile" className="dropdown-item">
                        <i className="feather icon-user" /> Profile
                      </Link>
                    </ListGroup.Item>

                    <ListGroup.Item as="li" bsPrefix=" ">
                      <Link className="dropdown-item" onClick={handleLogout}>
                        <i className="feather icon-log-out" /> Logout
                      </Link>
                    </ListGroup.Item>
                  </ListGroup>
          </div>
       </div>
       </>
      )}
    </React.Fragment>
  );
};

export default NavRight;