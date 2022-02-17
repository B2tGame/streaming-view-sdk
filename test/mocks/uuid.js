import { v4 as uuid } from 'uuid';

jest.mock('uuid');
uuid.mockImplementation(() => 'fake-uuid');

export default uuid;
