import React, { useState, useEffect } from 'react';
import { Card, Row, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import { API_URL } from '../../constants';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { toast } from 'react-toastify';
import Loader from './Loader';
import api from '../../utility/api';

const MeteriaMedica = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`${API_URL}/books?page=${currentPage}&perPage=${perPage}`);
        setData(response.data.books);
        setFilterData(response.data.books);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching data', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (Array.isArray(data)) {
      setFilterData(data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())));
    }
  }, [search, data]);

  const handleDelete = async (rewardId) => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this book ?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await api.delete(`${API_URL}/books/${rewardId}`);
              const updatedData = data.filter((quote) => quote._id !== rewardId);
              setData(updatedData);
              setFilterData(updatedData);
              toast.success('Book Deleted successfully!');
            } catch (error) {
              console.error('Error deleting book', error);
            }
          }
        },
        {
          label: 'No',
          onClick: () => console.log('Deletion cancelled')
        }
      ]
    });
  };

  const columns = [
    {
      name: 'S.No',
      cell: (row, index) => <div>{index + 1}</div>,
      sortable: true
    },
    {
      name: 'Title',
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: 'Description',
      selector: (row) => (row.description && row.description.length > 50 ? row.description.substring(0, 50) + '...' : row.description),
      sortable: true
    },
    {
      name: 'PDF file',
      selector: (row) => row.pdfFile,
      cell: (row) => <img src={row.image} alt={row.quote_title} width="50" />,
      sortable: true
    },
    {
      name: 'Edit',
      cell: (row) => (
        <Link to={`/book/${row._id}`}>
          <button className="w-100 btn btn-outline-info btn-sm user-button">Edit</button>
        </Link>
      )
    },
    {
      name: 'Delete',
      cell: (row) => (
        <button className="w-100 btn btn-outline-danger btn-sm user-button" onClick={() => handleDelete(row._id)}>
          Delete
        </button>
      )
    }
  ];

  return (
    <React.Fragment>
      <Row className="justify-content-center">
        <Card title="Books" isOption>
          <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
            <div>
              <h4 className="fw-bold">Books</h4>
              <p className="text-muted">All books list</p>
            </div>
            <Button variant="primary" as={Link} to="/book" className="btn-sm">
              Add New
            </Button>
          </div>
          <input
            type="text"
            placeholder="Search here"
            className="w-25 form-control "
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <Loader />
          ) : (
            <DataTable
              columns={columns}
              data={filterData}
              pagination
              paginationServer
              paginationPerPage={perPage}
              paginationTotalRows={totalPages * perPage}
              onChangePage={(page) => setCurrentPage(page)}
            />
          )}
        </Card>
      </Row>
    </React.Fragment>
  );
};

export default MeteriaMedica;
