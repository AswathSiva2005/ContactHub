import { Router } from 'express';
import { createContact, deleteContact, deleteSelectedContacts, getContact, getContacts, updateContact } from '../controllers/contactController.js';

export const contactRouter = Router();
contactRouter.post('/', createContact);
contactRouter.get('/', getContacts);
contactRouter.delete('/selected', deleteSelectedContacts);
contactRouter.get('/:contactUuid', getContact);
contactRouter.patch('/:contactUuid', updateContact);
contactRouter.delete('/:contactUuid', deleteContact);
