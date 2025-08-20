
import { Submission } from '../types';

const STORAGE_KEY = 'cap_formations_submissions';

export const storageService = {
  getSubmissions: (): Submission[] => {
    try {
      const submissionsJson = localStorage.getItem(STORAGE_KEY);
      return submissionsJson ? JSON.parse(submissionsJson) : [];
    } catch (error) {
      console.error("Error retrieving submissions from localStorage", error);
      return [];
    }
  },

  addSubmission: (newSubmission: Submission): void => {
    try {
      const submissions = storageService.getSubmissions();
      submissions.push(newSubmission);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch (error) {
      console.error("Error saving submission to localStorage", error);
    }
  },
};
