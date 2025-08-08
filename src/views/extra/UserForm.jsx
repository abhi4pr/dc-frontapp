import React, { useState, useEffect, useContext } from "react";
import { Card, Form, Button, ProgressBar, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";
import { FRONT_URL } from "../../constants";

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const [formData, setFormData] = useState({
    patientname: "",
    patientage: "",
    patientgender: "",
    patientemail: "",
    patientphone: "",
    patientaddress: "",
    suicide: "",
    addiction: [],
    skincondition: "",
    mentalcondition: "",
    discharge: "",
    vaccine: "",
    spiritual: "",
    support: "",
    medication: "",
    todayconcern: "",
    origintrigger: "",
    pattern: "",
    impact: "",
    thermal: "",
    energy: "",
    reactivity: "",
    physique: "",
    metabolic: "",
    miasmatic: [],
    familyhistory: "",
    nightmares: "",
    sleep: "",
    wakeup: "",
    fear: [],
    delusions: [],
    obsession: [],
    emotionaltrauma: "",
    mentalsymtoms: "",
    morning: "",
    forenoon: "",
    noon: "",
    afternoon: "",
    evening: "",
    night: "",
    beforeMidnight: "",
    afterMidnight: "",
    hotWeather: "",
    coldWeather: "",
    dampWeather: "",
    dryWeather: "",
    windyWeather: "",
    thunderstorms: "",
    menstrualcycle: "",
    flowduration: "",
    flowtype: "",
    pms: [],
    painpattern: "",
    systemreview: [],
    bodytemp: "",
    thirst: "",
    sleeppattern: "",
    sleepenv: [],
    image: null,
    pathsymptoms: "",
    miasanalysis: "",
    constassess: "",
    therachallenge: "",
    user: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_URL}/users/${id}`);
      setDoctorData(response.data?.user);
    } catch (error) {
      console.error("Error fetching data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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

    // Append all non-file fields
    for (const key in formData) {
      if (Array.isArray(formData[key]) && key !== "image") {
        formData[key].forEach((item) => data.append(key, item));
      } else if (
        key !== "image" &&
        formData[key] !== undefined &&
        formData[key] !== null
      ) {
        data.append(key, formData[key]);
      }
    }

    if (formData.image) {
      data.append("image", formData.image);
    }
    if (id) {
      data.append("user", id);
    }

    try {
      if (audioId) {
        await api.put(`${API_URL}/audios/${audioId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("cases updated successfully!");
      } else {
        await api.post(`${API_URL}/cases/add_post/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("cases added successfully!");
      }
      navigate("/app/dashboard");
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
        <h4 className="mb-3 text-center fw-bold">{"Share your details"}</h4>
        <h4>To Dr. {doctorData?.name}</h4>
        <ProgressBar now={(step / 8) * 100} className="mb-4" />
        <Form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Full Name"
                  name="patientname"
                  value={formData.patientname}
                  onChange={handleChange}
                  isInvalid={!!errors.patientname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientname}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Age"
                  name="patientage"
                  value={formData.patientage}
                  onChange={handleChange}
                  isInvalid={!!errors.patientage}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientage}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Gender</Form.Label>
                <Form.Control
                  as="select"
                  name="patientgender"
                  value={formData.patientgender}
                  onChange={handleChange}
                  isInvalid={!!errors.patientgender}
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
                  name="patientemail"
                  value={formData.patientemail}
                  onChange={handleChange}
                  isInvalid={!!errors.patientemail}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientemail}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Phone number</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Phone number"
                  name="patientphone"
                  value={formData.patientphone}
                  onChange={handleChange}
                  isInvalid={!!errors.patientphone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientphone}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Complete address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Complete address"
                  name="patientaddress"
                  value={formData.patientaddress}
                  onChange={handleChange}
                  isInvalid={!!errors.patientaddress}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientaddress}
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

          {step == 6 && (
            <>
              <Form.Group className="mb-3" controlId="formMorning">
                <Form.Label>Morning?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="morning"
                    value={option}
                    checked={formData.morning === option}
                    onChange={handleChange}
                    id={`morning-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formForenoon">
                <Form.Label>Forenoon?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="forenoon"
                    value={option}
                    checked={formData.forenoon === option}
                    onChange={handleChange}
                    id={`forenoon-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNoon">
                <Form.Label>Noon?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="noon"
                    value={option}
                    checked={formData.noon === option}
                    onChange={handleChange}
                    id={`noon-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formAfternoon">
                <Form.Label>Afternoon?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="afternoon"
                    value={option}
                    checked={formData.afternoon === option}
                    onChange={handleChange}
                    id={`afternoon-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEvening">
                <Form.Label>Evening?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="evening"
                    value={option}
                    checked={formData.evening === option}
                    onChange={handleChange}
                    id={`evening-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNight">
                <Form.Label>Night?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="night"
                    value={option}
                    checked={formData.night === option}
                    onChange={handleChange}
                    id={`night-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBeforeMidnight">
                <Form.Label>Before midnight?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="beforeMidnight"
                    value={option}
                    checked={formData.beforeMidnight === option}
                    onChange={handleChange}
                    id={`beforeMidnight-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formAfterMidnight">
                <Form.Label>After midnight?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="afterMidnight"
                    value={option}
                    checked={formData.afterMidnight === option}
                    onChange={handleChange}
                    id={`afterMidnight-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formHotWeather">
                <Form.Label>Hot weather?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="hotWeather"
                    value={option}
                    checked={formData.hotWeather === option}
                    onChange={handleChange}
                    id={`hotWeather-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formColdWeather">
                <Form.Label>Cold weather?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="coldWeather"
                    value={option}
                    checked={formData.coldWeather === option}
                    onChange={handleChange}
                    id={`coldWeather-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDampWeather">
                <Form.Label>Damp weather?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="dampWeather"
                    value={option}
                    checked={formData.dampWeather === option}
                    onChange={handleChange}
                    id={`dampWeather-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDryWeather">
                <Form.Label>Dry weather?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="dryWeather"
                    value={option}
                    checked={formData.dryWeather === option}
                    onChange={handleChange}
                    id={`dryWeather-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formWindyWeather">
                <Form.Label>Windy weather?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="windyWeather"
                    value={option}
                    checked={formData.windyWeather === option}
                    onChange={handleChange}
                    id={`windyWeather-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formThunderstorms">
                <Form.Label>Thunderstorms?</Form.Label>
                {["Better", "Worse"].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="radio"
                    label={option}
                    name="thunderstorms"
                    value={option}
                    checked={formData.thunderstorms === option}
                    onChange={handleChange}
                    id={`thunderstorms-${idx}`}
                  />
                ))}
              </Form.Group>
            </>
          )}

          {step == 7 && (
            <>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Menstrual Cycle Length</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Menstrual Cycle Length"
                  name="menstrualcycle"
                  value={formData.menstrualcycle}
                  onChange={handleChange}
                  isInvalid={!!errors.menstrualcycle}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.menstrualcycle}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Flow Duration</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Flow Duration"
                  name="flowduration"
                  value={formData.flowduration}
                  onChange={handleChange}
                  isInvalid={!!errors.flowduration}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.flowduration}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>select flow type</Form.Label>
                <Form.Control
                  as="select"
                  name="flowtype"
                  value={formData.flowtype}
                  onChange={handleChange}
                  isInvalid={!!errors.flowtype}
                >
                  <option value="">Select a flowtype</option>
                  <option value="heavy_clots">Heavy with clots</option>
                  <option value="heavy_bright">Heavy, bright red</option>
                  <option value="moderate_normal">Moderate, normal</option>
                  <option value="light_scanty">Light, scanty</option>
                  <option value="dark_thick">Dark, thick</option>
                  <option value="watery_thin">Watery, thin</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>PMS symptoms</Form.Label>
                {[
                  "Mood swings",
                  "Breast tenderness",
                  "Bloating",
                  "Headaches",
                  "Irritability",
                  "Food cravings",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="pms"
                    value={option}
                    checked={formData.pms?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`pms-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Menstrual Pain pattern</Form.Label>
                <Form.Control
                  as="select"
                  name="painpattern"
                  value={formData.painpattern}
                  onChange={handleChange}
                  isInvalid={!!errors.painpattern}
                >
                  <option value="">Pain pattern</option>
                  <option value="none">No pain</option>
                  <option value="before_better_flow">
                    Pain before, better with flow
                  </option>
                  <option value="during_flow">Pain during flow</option>
                  <option value="cramping_spasmodic">
                    Cramping, spasmodic
                  </option>
                  <option value="bearing_down">Bearing down sensation</option>
                  <option value="shooting_neuralgic">
                    Shooting, neuralgic
                  </option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Complete Systems Review</Form.Label>
                {[
                  "Headaches",
                  "Hair loss",
                  "Scalp conditions",
                  "Head injuries",
                  "Vision changes",
                  "Eye pain",
                  "Discharge",
                  "Light sensitivity",
                  "ears",
                  "Hearing loss",
                  "Tinnitus",
                  "Ear pain",
                  "Discharge",
                  "nose",
                  "Congestion",
                  "Nosebleeds",
                  "Loss of smell",
                  "Polyps",
                  "throat",
                  "Sore throat",
                  "Hoarseness",
                  "Difficulty swallowing",
                  "Throat clearing",
                  "respiratory",
                  "Cough",
                  "Shortness of breath",
                  "Wheezing",
                  "Chest pain",
                  "cardiac",
                  "Palpitations",
                  "Chest pain",
                  "Edema",
                  "Blood pressure issues",
                  "gastrointestinal",
                  "Nausea",
                  "Vomiting",
                  "Diarrhea",
                  "Constipation",
                  "Abdominal pain",
                  "urogenital",
                  "Urinary frequency",
                  "Pain on urination",
                  "Sexual dysfunction",
                  "Menstrual issues",
                  "Joint pain",
                  "Muscle aches",
                  "Stiffness",
                  "Weakness",
                  "neurological",
                  "Numbness",
                  "Tingling",
                  "Tremors",
                  "Memory issues",
                  "skin",
                  "Rashes",
                  "Itching",
                  "Moles changes",
                  "Healing issues",
                  "endocrine",
                  "Weight changes",
                  "Temperature intolerance",
                  "Excessive thirst",
                  "Fatigue",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="systemreview"
                    value={option}
                    checked={formData.systemreview?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`systemreview-${idx}`}
                  />
                ))}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Body Temperature</Form.Label>
                <Form.Control
                  as="select"
                  name="bodytemp"
                  value={formData.bodytemp}
                  onChange={handleChange}
                  isInvalid={!!errors.bodytemp}
                >
                  <option value="">Select pattern</option>
                  <option value="always_hot">Always feels too hot</option>
                  <option value="always_cold">Always feels too cold</option>
                  <option value="variable_seasons">Varies with seasons</option>
                  <option value="hot_head_cold_body">
                    Hot head, cold extremities
                  </option>
                  <option value="cold_spots">Cold spots on body</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Thirst Pattern</Form.Label>
                <Form.Control
                  as="select"
                  name="thirst"
                  value={formData.thirst}
                  onChange={handleChange}
                  isInvalid={!!errors.thirst}
                >
                  <option value="">Thirst characteristics</option>
                  <option value="excessive_large">
                    Excessive thirst, large quantities
                  </option>
                  <option value="frequent_small">Frequent small sips</option>
                  <option value="thirstless">Rarely feels thirsty</option>
                  <option value="thirst_fever">
                    Only thirsty during fever
                  </option>
                  <option value="cold_drinks">Desires cold drinks</option>
                  <option value="warm_drinks">Desires warm drinks</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Sleep time pattern</Form.Label>
                <Form.Control
                  as="select"
                  name="sleeppattern"
                  value={formData.sleeppattern}
                  onChange={handleChange}
                  isInvalid={!!errors.sleeppattern}
                >
                  <option value="">Sleep timing</option>
                  <option value="early_bed_early_rise">
                    Early to bed, early to rise
                  </option>
                  <option value="night_owl">Night owl, late sleeper</option>
                  <option value="catnaps_day">Takes catnaps during day</option>
                  <option value="insomnia_3am">
                    Wakes around 3 AM regularly
                  </option>
                  <option value="unrefreshing">Never feels refreshed</option>
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formSubstanceUse">
                <Form.Label>Sleep Environment Needs</Form.Label>
                {[
                  "Complete darkness",
                  "Some light",
                  "Fresh air/window open",
                  "Warm room",
                  "Cool room",
                  "Complete silence",
                  "Background noise",
                  "Multiple pillows",
                  "Firm mattress",
                  "Soft mattress",
                ].map((option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="sleepenv"
                    value={option}
                    checked={formData.sleepenv?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`sleepenv-${idx}`}
                  />
                ))}
              </Form.Group>
            </>
          )}

          {step == 8 && (
            <>
              <Form.Group as={Row} className="mb-3" controlId="formImage">
                <Form.Label column sm={2} style={{ textAlign: "right" }}>
                  Medical Records:
                </Form.Label>
                <Col sm={10}>
                  <Form.Control
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.image}
                  </Form.Control.Feedback>
                </Col>
                <Col sm={2}></Col>
                <Col sm={3} className="mt-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                      }}
                    />
                  )}
                </Col>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Pathology-Symptomatology Correlation</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Pathology-Symptomatology Correlation"
                  name="pathsymptoms"
                  value={formData.pathsymptoms}
                  onChange={handleChange}
                  isInvalid={!!errors.pathsymptoms}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.pathsymptoms}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Miasmatic Analysis from Records</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Miasmatic Analysis from Records"
                  name="miasanalysis"
                  value={formData.miasanalysis}
                  onChange={handleChange}
                  isInvalid={!!errors.miasanalysis}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.miasanalysis}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Constitutional Assessment from Records</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Constitutional Assessment from Records"
                  name="constassess"
                  value={formData.constassess}
                  onChange={handleChange}
                  isInvalid={!!errors.constassess}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.constassess}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Therapeutic Challenges & Considerations</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Therapeutic Challenges & Considerations"
                  name="therachallenge"
                  value={formData.therachallenge}
                  onChange={handleChange}
                  isInvalid={!!errors.therachallenge}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.therachallenge}
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
            {step < 8 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default UserForm;
