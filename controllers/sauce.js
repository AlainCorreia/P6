const Sauce = require('../models/Sauce');
const fs = require('fs');
const sauceValidation = require('../validation/sauce');

exports.createSauce = (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Requête invalide'});
  const sauceObject = JSON.parse(req.body.sauce);
  if (sauceObject.userId !== req.auth.userId) return res.status(400).json({ error: 'Requête invalide'});
  const validation = sauceValidation.schema.validate(sauceObject);
  if(validation.error) return res.status(400).json({ error: validation.error });
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce créée'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if(!sauce) return res.status(404).json({ message : 'Sauce non trouvée' });
  return res.status(200).json(sauce);
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.updateSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id })
  if(!sauce) return res.status(404).json({ message : 'Sauce non trouvée' });
  if (req.file) {
    const sauceObject = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    };
    const validation = sauceValidation.schema.validate(sauceObject);
    if(validation.error) return res.status(400).json({ error: validation.error });
    const filename = sauce.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée' }))
        .catch(error => res.status(400).json({ error }));
    })
  } else {
      const validation = sauceValidation.schemaNoImage.validate(req.body);
      if(validation.error) return res.status(400).json({ error: validation.error });
      Sauce.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée' }))
        .catch(error => res.status(400).json({ error }));
  }
};

exports.deleteSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id })
  if(!sauce) return res.status(404).json({ message : 'Sauce non trouvée' });
  if (sauce.userId !== req.auth.userId) return res.status(403).json({ error: 'Utilisateur non autorisé'});
  const filename = sauce.imageUrl.split('/images/')[1];
  fs.unlink(`images/${filename}`, () => {
    Sauce.deleteOne({ _id: req.params.id })
      .then(() => res.status(201).json({ message: 'Sauce supprimée' }))
      .catch(error => res.status(400).json({ error }));
  });
};

exports.rateSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if (!sauce) return res.status(404).json({ message: 'Sauce non trouvée'});
  
  switch (req.body.like) {
    
    case -1:
      if (sauce.usersLiked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce déjà likée' });
      if (sauce.usersDisliked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce déjà dislikée' });
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId },
        _id: req.params.id
      })
        .then(() => res.status(201).json({ message: 'Sauce dislikée' }))
        .catch(error => res.status(400).json({ error }))
      break;
    
    case 0:
      if (sauce.usersLiked.includes(req.body.userId)) {
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { likes: -1 },
          $pull: { usersLiked: req.body.userId },
          _id: req.params.id
        })
          .then(() => res.status(201).json({ message: 'Like annulé' }))
          .catch(error => res.status(400).json({ error }))
      }
      if (sauce.usersDisliked.includes(req.body.userId)) {
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { dislikes: -1 },
          $pull: { usersDisliked: req.body.userId },
          _id: req.params.id
         })
          .then(() => res.status(201).json({ message: 'Dislike annulé' }))
          .catch(error => res.status(400).json({ error }));
      }
      if (!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId))
        return res.status(403).json({ error: new Error('Requête non autorisée')});
      break;

    case 1:
      if(sauce.usersLiked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce déjà likée' });
      if (sauce.usersDisliked.includes(req.body.userId)) return res.status(403).json({ error : 'Sauce déjà dislikée' });
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId },
        _id: req.params.id
       })
         .then(() => res.status(201).json({ message: 'Sauce likée' }))
         .catch(error => res.status(400).json({ error }));
       break;

    default:
      return res.status(400).json({ error: new Error('Requête invalide') });
  };
};
