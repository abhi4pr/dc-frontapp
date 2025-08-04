import React, { useState, useEffect } from "react";
import { Card, Form, Button, ProgressBar } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";

const CaseIntakes = () => {
  const navigate = useNavigate();
  const { audioId } = useParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phone: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (audioId) {
      api
        .get(`${API_URL}/audios/${audioId}`)
        .then(({ data }) => {
          const { title, description, category, audioFile } = data.audio;
          setFormData({ title, description, category, audioFile: null });
          setImagePreview(audioFile);
        })
        .catch((error) => {
          console.error("Error fetching audio:", error);
          toast.error("Failed to load audio details");
        });
    }
  }, [audioId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentAddictions = prev.addiction || [];
      if (checked) {
        return { ...prev, addiction: [...currentAddictions, value] };
      } else {
        return {
          ...prev,
          addiction: currentAddictions.filter((item) => item !== value),
        };
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, audioFile: file }));
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateCurrentStep = () => {
    let newErrors = {};
    if (step === 1 && !formData.name.trim()) {
      newErrors.name = "name is required";
    }
    if (step === 2 && !formData.age) {
      newErrors.age = "age is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // if (validateCurrentStep())
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    if (formData.audioFile) data.append("audioFile", formData.audioFile);

    try {
      if (audioId) {
        await api.put(`${API_URL}/audios/${audioId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Audio updated successfully!");
      } else {
        await api.post(`${API_URL}/audios/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Audio added successfully!");
      }
      navigate("/audios");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "100%" }}>
      <Card className="p-4">
        <h4 className="mb-3 text-center fw-bold">
          {audioId ? "Edit Audio" : "Add Case"}
        </h4>
        <ProgressBar now={(step / 3) * 100} className="mb-4" />
        <Form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Full Name"
                  name="fullname"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Age"
                  name="Age"
                  value={formData.age}
                  onChange={handleChange}
                  isInvalid={!!errors.age}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.age}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Gender</Form.Label>
                <Form.Control
                  as="select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  isInvalid={!!errors.gender}
                >
                  <option value="">Select a gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Email"
                  name="Email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Phone number</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Phone number"
                  name="phonenumber"
                  value={formData.phone}
                  onChange={handleChange}
                  isInvalid={!!errors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Complete address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Complete address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  isInvalid={!!errors.address}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.address}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {step === 2 && (
            <>
              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>
                  Current thoughts of self-harm or suicide?{" "}
                </Form.Label>
                {[
                  "Never",
                  "Rarely (few times a year)",
                  "Sometimes (monthly)",
                  "Often (weekly)",
                  "Daily or constant",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="suicide"
                    value={option}
                    checked={formData.suicide === option}
                    onChange={handleChange}
                    id={`suicide-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Addiction history</Form.Label>
                {[
                  "Alcohol",
                  "Tobacco/Smoking",
                  "Cannabis",
                  "Prescription drugs",
                  "Stimulants",
                  "Other substances",
                  "Behavioral Addictions",
                  "Gaming",
                  "Social media",
                  "Shopping",
                  "Gambling",
                  "Work",
                  "Exercise",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="addiction"
                    value={option}
                    checked={formData.addiction?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`addiction-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Skin Conditions Suppressed</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Skin Conditions Suppressed"
                  name="skincondition"
                  value={formData.skincondition}
                  onChange={handleChange}
                  isInvalid={!!errors.skincondition}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.skincondition}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Emotional/Mental Suppression</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Emotional/Mental Suppression"
                  name="mentalcondition"
                  value={formData.mentalcondition}
                  onChange={handleChange}
                  isInvalid={!!errors.mentalcondition}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.mentalcondition}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Discharge Suppression</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Discharge Suppression"
                  name="discharge"
                  value={formData.discharge}
                  onChange={handleChange}
                  isInvalid={!!errors.discharge}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.discharge}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Vaccination Reactions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Vaccination Reactions"
                  name="vaccine"
                  value={formData.vaccine}
                  onChange={handleChange}
                  isInvalid={!!errors.vaccine}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.vaccine}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Spiritual/Religious Practices</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Spiritual/Religious Practices"
                  name="spiritual"
                  value={formData.spiritual}
                  onChange={handleChange}
                  isInvalid={!!errors.spiritual}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.spiritual}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Support system availability</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Support system availability"
                  name="support"
                  value={formData.support}
                  onChange={handleChange}
                  isInvalid={!!errors.support}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.support}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>
                  Current medications (especially psychiatric/neurological)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Current medications (especially psychiatric/neurological)"
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  isInvalid={!!errors.medication}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.medication}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {step === 3 && (
            <>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>What is your main concern today?</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="What is your main concern today?"
                  name="todayconcern"
                  value={formData.todayconcern}
                  onChange={handleChange}
                  isInvalid={!!errors.todayconcern}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.todayconcern}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Origin Trigger</Form.Label>
                <Form.Control
                  as="select"
                  name="origintrigger"
                  value={formData.origintrigger}
                  onChange={handleChange}
                  isInvalid={!!errors.origintrigger}
                >
                  <option value="">Please select</option>
                  <option value="emotional_shock">
                    Emotional shock/trauma
                  </option>
                  <option value="grief_loss">Grief/loss of loved one</option>
                  <option value="betrayal">Betrayal/deception</option>
                  <option value="fear_fright">Sudden fear/fright</option>
                  <option value="anger_rage">Intense anger/rage</option>
                  <option value="physical_injury">
                    Physical injury/accident
                  </option>
                  <option value="illness">After acute illness</option>
                  <option value="suppression">Suppression of symptoms</option>
                  <option value="vaccination">Post-vaccination</option>
                  <option value="overwork">Mental/physical overexertion</option>
                  <option value="unknown">Cannot identify</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Evolution Pattern</Form.Label>
                <Form.Control
                  as="select"
                  name="pattern"
                  value={formData.pattern}
                  onChange={handleChange}
                  isInvalid={!!errors.pattern}
                >
                  <option value="">Select</option>
                  <option value="sudden_severe">Sudden onset, severe</option>
                  <option value="gradual_worse">
                    Gradual onset, getting worse
                  </option>
                  <option value="intermittent">Comes and goes</option>
                  <option value="periodic">Regular periodicity</option>
                  <option value="alternating">
                    Alternates with other symptoms
                  </option>
                  <option value="suppressed_return">
                    Returns after suppression
                  </option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Mental Impact</Form.Label>
                <Form.Control
                  as="select"
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  isInvalid={!!errors.impact}
                >
                  <option value="">Select a impact</option>
                  <option value="anxiety_increased">Increased anxiety</option>
                  <option value="depression_mood">Depression/low mood</option>
                  <option value="irritability">Increased irritability</option>
                  <option value="fear_disease">Fear of disease/death</option>
                  <option value="confidence_loss">Loss of confidence</option>
                  <option value="isolation">Social withdrawal</option>
                  <option value="obsessive">Obsessive about symptoms</option>
                </Form.Control>
              </Form.Group>
            </>
          )}

          {step == 4 && (
            <>
              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>thermal Constitution? </Form.Label>
                {["Hot", "Cold", "Variable"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="thermal"
                    value={option}
                    checked={formData.thermal === option}
                    onChange={handleChange}
                    id={`thermal-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>Energy Constitution? </Form.Label>
                {["sanguine", "phlegmatic", "choleric", "melancholic"].map(
                  (option, idx) => (
                    <Form.Check
                      key={idx}
                      type="radio"
                      label={option}
                      name="energy"
                      value={option}
                      checked={formData.energy === option}
                      onChange={handleChange}
                      id={`energy-${idx}`}
                    />
                  )
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>Reactivity Constitution? </Form.Label>
                {["hypersensitive", "hyposensitive", "balanced"].map(
                  (option, idx) => (
                    <Form.Check
                      key={idx}
                      type="radio"
                      label={option}
                      name="reactivity"
                      value={option}
                      checked={formData.reactivity === option}
                      onChange={handleChange}
                      id={`reactivity-${idx}`}
                    />
                  )
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>build and physique</Form.Label>
                <Form.Control
                  as="select"
                  name="physique"
                  value={formData.physique}
                  onChange={handleChange}
                  isInvalid={!!errors.physique}
                >
                  <select class="w-full p-2 border rounded-md">
                    <option value="">Select build</option>
                    <option value="tall_thin">
                      Tall, thin, lean (phosphoric)
                    </option>
                    <option value="medium_balanced">
                      Medium, well-proportioned
                    </option>
                    <option value="short_stout">
                      Short, stout, heavy (carbonic)
                    </option>
                    <option value="muscular_athletic">
                      Muscular, athletic build
                    </option>
                  </select>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Metabolic pace</Form.Label>
                <Form.Control
                  as="select"
                  name="metabolic"
                  value={formData.metabolic}
                  onChange={handleChange}
                  isInvalid={!!errors.metabolic}
                >
                  <select class="w-full p-2 border rounded-md">
                    <option value="">Select pace</option>
                    <option value="fast">
                      Fast metabolism, burns energy quickly
                    </option>
                    <option value="slow">
                      Slow metabolism, gains weight easily
                    </option>
                    <option value="variable">
                      Variable, depends on stress/season
                    </option>
                  </select>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Miasmatic Assessment</Form.Label>
                {["Psoric Miasm", "Sycotic Miasm", "Syphilitic Miasm"].map(
                  (option, idx) => (
                    <Form.Check
                      key={idx}
                      type="checkbox"
                      label={option}
                      name="miasmatic"
                      value={option}
                      checked={formData.miasmatic?.includes(option)}
                      onChange={handleCheckboxChange}
                      id={`miasmatic-${idx}`}
                    />
                  )
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Family diseases history</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Family diseases history"
                  name="familyhistory"
                  value={formData.familyhistory}
                  onChange={handleChange}
                  isInvalid={!!errors.familyhistory}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.familyhistory}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {step == 5 && (
            <>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Nightmares</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="night mares"
                  name="nightmares"
                  value={formData.nightmares}
                  onChange={handleChange}
                  isInvalid={!!errors.nightmares}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nightmares}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Sleep pattern</Form.Label>
                <Form.Control
                  as="select"
                  name="sleep"
                  value={formData.sleep}
                  onChange={handleChange}
                  isInvalid={!!errors.sleep}
                >
                  <option value="">Select pattern</option>
                  <option value="anxious_bedtime">Anxious at bedtime</option>
                  <option value="racing_thoughts">
                    Racing thoughts preventing sleep
                  </option>
                  <option value="fear_sleep">Fear of sleeping/death</option>
                  <option value="peaceful_sleep">
                    Generally peaceful sleep
                  </option>
                  <option value="restless_dreams">
                    Restless with vivid dreams
                  </option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>How do you wake up</Form.Label>
                <Form.Control
                  as="select"
                  name="wakeup"
                  value={formData.wakeup}
                  onChange={handleChange}
                  isInvalid={!!errors.wakeup}
                >
                  <option value="">How do you wake up?</option>
                  <option value="refreshed_positive">
                    Refreshed and positive
                  </option>
                  <option value="groggy_confused">Groggy and confused</option>
                  <option value="anxious_worried">Anxious about the day</option>
                  <option value="sad_depressed">Sad or depressed</option>
                  <option value="irritable_angry">Irritable or angry</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Fears ?</Form.Label>
                {[
                  "Death",
                  "Disease",
                  "Poverty",
                  "Future",
                  "Animals",
                  "Darkness",
                  "Crowd",
                  "height",
                  "Alone",
                  "water",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="fear"
                    value={option}
                    checked={formData.fear?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`fear-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>delusions ?</Form.Label>
                {[
                  "persecution",
                  "Body",
                  "identity",
                  "reality",
                  "guilty",
                  "Control",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="delusions"
                    value={option}
                    checked={formData.delusions?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`delusions-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Obsession ?</Form.Label>
                {[
                  "cleanliness",
                  "checking",
                  "religious",
                  "order",
                  "counting",
                  "health",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="obsession"
                    value={option}
                    checked={formData.obsession?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`obsession-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Emotinoal trauma</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Emotional trauma"
                  name="emotionaltrauma"
                  value={formData.emotionaltrauma}
                  onChange={handleChange}
                  isInvalid={!!errors.emotionaltrauma}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nightmares}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>
                  Strange, Rare & Peculiar Mental Symptoms
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Strange, Rare & Peculiar Mental Symptoms"
                  name="mentalsymtoms"
                  value={formData.mentalsymtoms}
                  onChange={handleChange}
                  isInvalid={!!errors.mentalsymtoms}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.mentalsymtoms}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          <div className="d-flex justify-content-between mt-4">
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? "Submitting..." : audioId ? "Update" : "Submit"}
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CaseIntakes;
