import React, { useState } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../constants';
import { useNavigate } from 'react-router-dom';
import api from '../../utility/api';

const STEP_TYPES = [
  "quote", "video", "dialogue", "question", "image", "instruction"
];

const TASK_TYPES = [
  "custom"
];

const emptyStep = (order = 1) => ({
  sequenceOrder: order,
  type: 'quote',
  content: {
    text: '',
    src: '',
    sound: '',
    speaker: '',
    avatar: '',
    dialogues: [],
    options: []
  },
  isSkippable: false,
  isMandatory: true
});

const emptyTask = () => ({
  title: '',
  description: '',
  isCompleted: false,
  type: 'quiz',
  data: {}
});

const RemedySuggestion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    levelNumber: '',
    title: '',
    steps: [],
    tasks: [],
    rewards: { unlocks: [], message: '' }
  });

  // For media upload
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle main form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle rewards fields
  const handleRewardsChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      rewards: { ...formData.rewards, [name]: value }
    });
  };

  // Handle unlocks (comma separated)
  const handleUnlocksChange = (e) => {
    setFormData({
      ...formData,
      rewards: { ...formData.rewards, unlocks: e.target.value.split(',').map(s => s.trim()) }
    });
  };

  // Media upload
  const handleFileChange = (e) => setMediaFile(e.target.files[0]);
  const handleUpload = async () => {
    if (!mediaFile) return toast.error('No file selected');
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', mediaFile);
      const res = await api.post(`${API_URL}/upload/media`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedUrl(res.data.url);
      toast.success('Uploaded successfully!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Steps logic
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, emptyStep(formData.steps.length + 1)]
    });
  };

  const handleRemoveStep = (idx) => {
    const steps = [...formData.steps];
    steps.splice(idx, 1);
    // Reorder sequenceOrder
    steps.forEach((s, i) => s.sequenceOrder = i + 1);
    setFormData({ ...formData, steps });
  };

  const handleStepChange = (idx, field, value) => {
    const steps = [...formData.steps];
    steps[idx][field] = value;
    setFormData({ ...formData, steps });
  };

  const handleStepContentChange = (idx, field, value) => {
    const steps = [...formData.steps];
    steps[idx].content[field] = value;
    setFormData({ ...formData, steps });
  };

  // For dialogues array
  const handleDialoguesChange = (idx, value) => {
    const steps = [...formData.steps];
    steps[idx].content.dialogues = value.split('\n');
    setFormData({ ...formData, steps });
  };

  // For options array (question step)
  const handleAddOption = (stepIdx) => {
    const steps = [...formData.steps];
    steps[stepIdx].content.options.push({ text: '', value: '', image: '' });
    setFormData({ ...formData, steps });
  };

  const handleRemoveOption = (stepIdx, optIdx) => {
    const steps = [...formData.steps];
    steps[stepIdx].content.options.splice(optIdx, 1);
    setFormData({ ...formData, steps });
  };

  const handleOptionChange = (stepIdx, optIdx, field, value) => {
    const steps = [...formData.steps];
    steps[stepIdx].content.options[optIdx][field] = value;
    setFormData({ ...formData, steps });
  };

  // Tasks logic
  const handleAddTask = () => {
    setFormData({ ...formData, tasks: [...formData.tasks, emptyTask()] });
  };

  const handleRemoveTask = (idx) => {
    const tasks = [...formData.tasks];
    tasks.splice(idx, 1);
    setFormData({ ...formData, tasks });
  };

  const handleTaskChange = (idx, field, value) => {
    const tasks = [...formData.tasks];
    tasks[idx][field] = value;
    setFormData({ ...formData, tasks });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.levelNumber || !formData.title) {
      toast.error('Level Number and Title are required');
      return;
    }
    try {
      await api.post(`${API_URL}/levels/`, formData);
      toast.success('Level created successfully!');
      navigate('/levels');
    } catch (err) {
      toast.error('Failed to create level');
    }
  };

  return (
    <Row className="justify-content-center">
      <Card className="p-4" style={{ maxWidth: 900 }}>
        <h4 className="mb-4">Create New Level</h4>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Level Number</Form.Label>
            <Col sm={9}>
              <Form.Control type="number" name="levelNumber" value={formData.levelNumber} onChange={handleInputChange} required />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Title</Form.Label>
            <Col sm={9}>
              <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} required />
            </Col>
          </Form.Group>

          {/* Rewards */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Rewards Unlocks</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="text"
                placeholder="Comma separated (e.g. diary,mirror,replay)"
                value={formData.rewards.unlocks.join(', ')}
                onChange={handleUnlocksChange}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Rewards Message</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="text"
                name="message"
                value={formData.rewards.message}
                onChange={handleRewardsChange}
              />
            </Col>
          </Form.Group>

          {/* Media upload */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Upload Media</Form.Label>
            <Col sm={6}>
              <Form.Select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </Form.Select>
              <Form.Control type="file" onChange={handleFileChange} className="mt-2" accept="image/*,video/*,audio/*" />
            </Col>
            <Col sm={3}>
              <Button variant="secondary" onClick={handleUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</Button>
            </Col>
          </Form.Group>
          {uploadedUrl && (
            <Row className="mb-3">
              <Col sm={{ span: 9, offset: 3 }}>
                <small>Uploaded URL:</small>
                <Form.Control type="text" readOnly value={uploadedUrl} />
              </Col>
            </Row>
          )}

          {/* Steps */}
          <h5 className="mt-4">Steps</h5>
          {formData.steps.map((step, idx) => (
            <Card key={idx} className="mb-3 p-3">
              <Row>
                <Col sm={3}>
                  <Form.Select
                    value={step.type}
                    onChange={e => handleStepChange(idx, 'type', e.target.value)}
                  >
                    {STEP_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col sm={2}>
                  <Form.Check
                    type="checkbox"
                    label="Skippable"
                    checked={step.isSkippable}
                    onChange={e => handleStepChange(idx, 'isSkippable', e.target.checked)}
                  />
                </Col>
                <Col sm={2}>
                  <Form.Check
                    type="checkbox"
                    label="Mandatory"
                    checked={step.isMandatory}
                    onChange={e => handleStepChange(idx, 'isMandatory', e.target.checked)}
                  />
                </Col>
                <Col sm={2}>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveStep(idx)}>Remove</Button>
                </Col>
              </Row>
              {/* Dynamic content fields */}
              <Row className="mt-2">
                {(step.type === 'quote' || step.type === 'dialogue' || step.type === 'question' || step.type === 'instruction') && (
                  <Col sm={6}>
                    <Form.Control
                      type="text"
                      placeholder="Text"
                      value={step.content.text}
                      onChange={e => handleStepContentChange(idx, 'text', e.target.value)}
                    />
                  </Col>
                )}
                {(step.type === 'video' || step.type === 'image' || step.type === 'avatar') && (
                  <Col sm={6}>
                    <Form.Control
                      type="text"
                      placeholder="Media URL"
                      value={step.content.src}
                      onChange={e => handleStepContentChange(idx, 'src', e.target.value)}
                    />
                  </Col>
                )}
                {step.type === 'dialogue' && (
                  <>
                    <Col sm={6} className="mt-2">
                      <Form.Control
                        type="text"
                        placeholder="Speaker"
                        value={step.content.speaker}
                        onChange={e => handleStepContentChange(idx, 'speaker', e.target.value)}
                      />
                    </Col>
                    <Col sm={12} className="mt-2">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Dialogues (one per line)"
                        value={step.content.dialogues.join('\n')}
                        onChange={e => handleDialoguesChange(idx, e.target.value)}
                      />
                    </Col>
                  </>
                )}
                {step.type === 'avatar' && (
                  <Col sm={6} className="mt-2">
                    <Form.Control
                      type="text"
                      placeholder="Avatar Image URL"
                      value={step.content.avatar}
                      onChange={e => handleStepContentChange(idx, 'avatar', e.target.value)}
                    />
                  </Col>
                )}
                {(step.type === 'video' || step.type === 'image' || step.type === 'dialogue') && (
                  <Col sm={6} className="mt-2">
                    <Form.Control
                      type="text"
                      placeholder="Sound URL"
                      value={step.content.sound}
                      onChange={e => handleStepContentChange(idx, 'sound', e.target.value)}
                    />
                  </Col>
                )}
                {/* Options for question */}
                {step.type === 'question' && (
                  <Col sm={12} className="mt-2">
                    <h6>Options</h6>
                    {step.content.options.map((opt, optIdx) => (
                      <Row key={optIdx} className="mb-2">
                        <Col sm={4}>
                          <Form.Control
                            type="text"
                            placeholder="Option Text"
                            value={opt.text}
                            onChange={e => handleOptionChange(idx, optIdx, 'text', e.target.value)}
                          />
                        </Col>
                        <Col sm={3}>
                          <Form.Control
                            type="text"
                            placeholder="Value"
                            value={opt.value}
                            onChange={e => handleOptionChange(idx, optIdx, 'value', e.target.value)}
                          />
                        </Col>
                        <Col sm={3}>
                          <Form.Control
                            type="text"
                            placeholder="Image URL"
                            value={opt.image}
                            onChange={e => handleOptionChange(idx, optIdx, 'image', e.target.value)}
                          />
                        </Col>
                        <Col sm={2}>
                          <Button variant="danger" size="sm" onClick={() => handleRemoveOption(idx, optIdx)}>Remove</Button>
                        </Col>
                      </Row>
                    ))}
                    <Button variant="secondary" size="sm" onClick={() => handleAddOption(idx)}>Add Option</Button>
                  </Col>
                )}
              </Row>
            </Card>
          ))}
          <Button variant="info" onClick={handleAddStep}>Add Step</Button>

          {/* Tasks */}
          <h5 className="mt-4">Tasks</h5>
          {formData.tasks.map((task, idx) => (
            <Card key={idx} className="mb-3 p-3">
              <Row>
                <Col sm={4}>
                  <Form.Control
                    type="text"
                    placeholder="Task Title"
                    value={task.title}
                    onChange={e => handleTaskChange(idx, 'title', e.target.value)}
                  />
                </Col>
                <Col sm={4}>
                  <Form.Control
                    type="text"
                    placeholder="Description"
                    value={task.description}
                    onChange={e => handleTaskChange(idx, 'description', e.target.value)}
                  />
                </Col>
                <Col sm={2}>
                  <Form.Select
                    value={task.type}
                    onChange={e => handleTaskChange(idx, 'type', e.target.value)}
                  >
                    {TASK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col sm={2}>
                  <Button variant="danger" size="sm" onClick={() => handleRemoveTask(idx)}>Remove</Button>
                </Col>
              </Row>
            </Card>
          ))}
          <Button variant="info" onClick={handleAddTask}>Add Task</Button>

          {/* Submit */}
          <Form.Group as={Row} className="mb-3 mt-4">
            <Col sm={{ span: 9, offset: 3 }}>
              <Button variant="primary" type="submit">Create Level</Button>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default RemedySuggestion;
// ...end of file...