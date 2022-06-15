const Sauce = require('../models/Sauce');
const fs = require('fs');
const sauceValidation = require('../validation/sauce');

// CREATE

exports.createSauce = (req, res, next) => {
  // Check if the request contains a file (image)
  if (!req.file) return res.status(400).json({ error: 'Invalid request.'});

  const sauceObject = JSON.parse(req.body.sauce);

  // Check userId in the request
  if (sauceObject.userId !== req.auth.userId) {
    fs.unlink(`images/${req.file.filename}`, (error) => {
      if (error) throw error;
    }) 
    return res.status(400).json({ error: 'Invalid Request.'});
  } 

  // Request validation
  const validation = sauceValidation.schema.validate(sauceObject);
  if(validation.error) return res.status(400).json({ error: validation.error });

  // Create new sauce and save to database
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce created.'}))
    .catch(error => res.status(400).json({ error }));
};

// READ

exports.getOneSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findOne({ _id: req.params.id });
    return res.status(200).json(sauce);
  } catch (error) {
      res.status(404).json({ error });
  }
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

// UPDATE

exports.updateSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findOne({ _id: req.params.id });
    
    // If image is updated
    if (req.file) {
      const sauceObject = {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      };
      
      // Check userId in the request
      if (sauceObject.userId !== req.auth.userId) {
      fs.unlink(`images/${req.file.filename}`, (error) => {
        if (error) throw error;
      }) 
      return res.status(400).json({ error: 'Invalid Request.'});
      };
      
      // Request validation
      const validation = sauceValidation.schema.validate(sauceObject);
      if(validation.error) return res.status(400).json({ error: validation.error });
      // Delete old image from server and update sauce
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce updated.' }))
          .catch(error => res.status(400).json({ error }));
      })
      
      // If image is not updated
    } else {
        // Request validation
        const validation = sauceValidation.schemaNoImage.validate(req.body);
        if(validation.error) return res.status(400).json({ error: validation.error });
        
        // Update sauce
        Sauce.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce updated.' }))
          .catch(error => res.status(400).json({ error }));
    };
  } catch (error) {
      res.status(404).json({ error });
  };
};

exports.rateSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findOne({ _id: req.params.id });
    switch (req.body.like) {
    // Dislike
    case -1:
      // Check if the user has already liked or disliked the sauce
      if (sauce.usersLiked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce already liked' });
      if (sauce.usersDisliked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce already disliked' });
      // If not update sauce (increment dislikes and add userId to usersDisliked array)
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId },
        _id: req.params.id
      })
        .then(() => res.status(201).json({ message: 'Sauce disliked.' }))
        .catch(error => res.status(400).json({ error }))
      break;
    // Cancel like or dislike
    case 0:
      // If liked, decrement likes and remove userId from usersLiked array
      if (sauce.usersLiked.includes(req.body.userId)) {
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { likes: -1 },
          $pull: { usersLiked: req.body.userId },
          _id: req.params.id
        })
          .then(() => res.status(201).json({ message: 'Like canceled.' }))
          .catch(error => res.status(400).json({ error }))
      }
      // If disliked, decrement dislikes and remove userId from usersDisliked array
      if (sauce.usersDisliked.includes(req.body.userId)) {
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { dislikes: -1 },
          $pull: { usersDisliked: req.body.userId },
          _id: req.params.id
         })
          .then(() => res.status(201).json({ message: 'Dislike canceled.' }))
          .catch(error => res.status(400).json({ error }));
      }
      // Check if the user has neither liked nor disliked the sauce
      if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId))
        return res.status(400).json({ error: 'Invalid request.' });
      break;
    // Like
    case 1:
      // Check if the user has already liked or disliked the sauce
      if(sauce.usersLiked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce already liked.' });
      if (sauce.usersDisliked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce already disliked.' });
      // If not, increment likes and add userId to usersLiked array)
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId },
        _id: req.params.id
       })
         .then(() => res.status(201).json({ message: 'Sauce liked.' }))
         .catch(error => res.status(400).json({ error }));
       break;

    default:
      return res.status(400).json({ error: 'Invalid request.' });
  };
  } catch (error) {
      res.status(404).json({ error });
  };
};

// DELETE

exports.deleteSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findOne({ _id: req.params.id })

   // Check if the user is the owner of the sauce
    if (sauce.userId !== req.auth.userId) return res.status(403).json({ error: 'Unauthorized user.'});
    
    // Remove image from server and sauce from database
    const filename = sauce.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
      Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(201).json({ message: 'Sauce deleted.' }))
        .catch(error => res.status(400).json({ error }));
    });
  } catch (error) {
      res.status(404).json({ error });
  }
};
