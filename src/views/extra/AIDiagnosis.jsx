import React, { useState, useEffect } from 'react';
import { Card, Row, Button, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import DataTable from "react-data-table-component";
import axios from 'axios';
import { API_URL } from '../../constants';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { toast } from 'react-toastify';
import Loader from './Loader';
import api from '../../utility/api'

const AIDiagnosis = () => {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);
    const [filterData, setFilterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`${API_URL}/diets?page=${currentPage}&perPage=${perPage}`);
                setData(response.data.diets);
                setTotalPages(response.data.totalPages)
                setFilterData(response.data.diets);
            } catch (error) {
                console.error('Error fetching data', error);
            }
            setLoading(false);
        };
        fetchData();
    }, [currentPage]);

    useEffect(() => {
        setFilterData(data.filter((d) => d.title.toLowerCase().includes(search.toLowerCase())));
    }, [search, data]);

    const handleDelete = async (audioId) => {
        confirmAlert({
            title: 'Confirm Deletion',
            message: 'Are you sure you want to delete this diet ?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        try {
                            await api.delete(`${API_URL}/diets/${audioId}`);
                            const updatedData = data.filter(quote => quote._id !== audioId);
                            setData(updatedData);
                            setFilterData(updatedData);
                            toast.success('Diet Deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting Diet', error);
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
            name: "S.No",
            cell: (row, index) => <div>{(currentPage - 1) * perPage + index + 1}</div>,

            sortable: true,
        },
        {
            name: "Title",
            selector: (row) => row.title,
            sortable: true,

        },
        {
            name: "Description",
            selector: (row) => row.description,
            sortable: true,

        },
        {
            name: "Category",
            selector: (row) => row.category,
            sortable: true,

        },
        {
            name: "calories",
            selector: (row) => row.calories,
            sortable: true,

        },
        {
            name: "Image",
            selector: (row) => row.image,
            cell: (row) => <img src={row.image} width="50" />,
            sortable: true,

        },
        {
            name: "Edit",
            cell: (row) => (
                <Link to={`/diet/${row._id}`}>
                    <button className="w-100 btn btn-outline-info btn-sm user-button">
                        Edit
                    </button>
                </Link>
            ),

        },
        {
            name: "Delete",
            cell: (row) => (
                <button
                    className="w-100 btn btn-outline-danger btn-sm user-button"
                    onClick={() => handleDelete(row._id)}
                >
                    Delete
                </button>
            ),

        },
    ]

    return (
        <React.Fragment>
            <Row className="justify-content-center">
                <Card>
                    <Card.Body>
                        <Row style={{ marginBottom: 20 }}>
                            <div>
                                <h4 className="fw-bold">Diets</h4>
                                <p className="text-muted">All Diets list</p>
                            </div>
                            <Col md={6}>
                                <input
                                    type="text"
                                    placeholder="Search Diets..."
                                    className="form-control"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Col>
                            <Col md={6} className="text-end">
                                <Link to="/diet">
                                    <Button variant="primary">Add Diet</Button>
                                </Link>
                            </Col>
                        </Row>

                        {loading ? <Loader /> : (
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

                    </Card.Body>
                </Card>
            </Row>
        </React.Fragment>
    );
};

export default AIDiagnosis;