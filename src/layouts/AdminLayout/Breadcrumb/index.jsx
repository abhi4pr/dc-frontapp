import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ListGroup } from "react-bootstrap";
import navigation from "../../../menu-items";
import { BASE_TITLE } from "../../../config/constant";

const Breadcrumb = () => {
  const [main, setMain] = useState([]);
  const [item, setItem] = useState([]);
  const location = useLocation();

  useEffect(() => {
    navigation.items.map((item, index) => {
      if (item.type && item.type === "group") {
        getCollapse(item, index);
      }
      return false;
    });
  });

  const getCollapse = (item) => {
    if (item.children) {
      item.children.filter((collapse) => {
        if (collapse.type === "collapse") {
          getCollapse(collapse);
        } else if (collapse.type && collapse.type === "item") {
          if (
            location.pathname ===
            import.meta.env.VITE_APP_BASE_NAME + collapse.url
          ) {
            setMain(item);
            setItem(collapse);
          }
        }
        return false;
      });
    }
  };

  let mainContent, itemContent;
  let breadcrumbContent = "";
  let title = "";

  if (main && main.type === "collapse") {
    mainContent = (
      <ListGroup.Item as="li" className="breadcrumb-item">
        <Link
          to="#"
          className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          {main.title}
        </Link>
      </ListGroup.Item>
    );
  }

  if (item && item.type === "item") {
    title = item.title;
    itemContent = (
      <ListGroup.Item as="li" className="breadcrumb-item">
        <Link
          to="#"
          className="text-gray-800 font-medium hover:text-gray-900 transition-colors duration-200"
        >
          {title}
        </Link>
      </ListGroup.Item>
    );

    if (item.breadcrumbs !== false) {
      breadcrumbContent = (
        <div className="w-full px-4 py-3 bg-white rounded-2xl shadow-md mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h5 className="text-lg font-semibold text-gray-900 tracking-tight">
              {title}
            </h5>
            <ListGroup as="ul" className="flex flex-wrap gap-2 text-sm">
              <ListGroup.Item as="li" className="breadcrumb-item">
                <Link
                  to="/"
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors duration-200"
                >
                  <i className="feather icon-home text-base" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </ListGroup.Item>
              {mainContent}
              {itemContent}
            </ListGroup>
          </div>
        </div>
      );
    }

    useEffect(() => {
      document.title = title + BASE_TITLE;
    }, [title]);
  }

  return <React.Fragment>{breadcrumbContent}</React.Fragment>;
};

export default Breadcrumb;
